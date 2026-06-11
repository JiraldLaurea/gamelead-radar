import { emailSubjectTemplate } from "@/lib/email-template-defaults";
import { getEmailBodyTemplate, getEmailTemplateAttachmentForSend } from "@/lib/email-template";
import { enrichOpportunityLead } from "@/lib/lead-enrichment";
import { canRecordEmailWithoutSmtp, emailForOpportunityWithTemplate, sendLeadEmail, smtpConfigured } from "@/lib/mailer";
import { getOperationsSettings } from "@/lib/operations-settings";
import { prisma } from "@/lib/prisma";

export async function runAutomaticEmailPass() {
  const settings = await getOperationsSettings();
  if (!settings.autoEmailEnabled) {
    return { skipped: true, reason: "disabled", sent: 0, failed: 0 };
  }

  const debugNoSend = await canRecordEmailWithoutSmtp();
  if (!debugNoSend && !smtpConfigured()) {
    await prisma.systemLog.create({
      data: {
        level: "warning",
        module: "email",
        message: "Automatic email sending is enabled, but SMTP is not configured."
      }
    });
    return { skipped: true, reason: "smtp_missing", sent: 0, failed: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sentToday = await prisma.outreachMessage.count({
    where: {
      channel: "email",
      status: "sent",
      updatedAt: { gte: today }
    }
  });
  const remaining = Math.max(settings.autoEmailDailyLimit - sentToday, 0);
  if (remaining === 0) {
    return { skipped: true, reason: "daily_limit_reached", sent: 0, failed: 0 };
  }

  const candidates = await prisma.opportunity.findMany({
    where: {
      grade: "A",
      outreachMessages: { none: { channel: "email", status: "sent" } }
    },
    include: { company: true, game: true, outreachMessages: true },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: Math.min(Math.max(remaining * 3, remaining), 50)
  });
  if (candidates.length === 0) {
    return { skipped: true, reason: "no_grade_a_candidates", sent: 0, failed: 0, candidatesChecked: 0, withoutEmail: 0 };
  }
  function emailCandidatePriority(candidate: (typeof candidates)[number]) {
    if (candidate.company.contactEmail) return 0;
    if (candidate.company.enrichmentStatus === "not_started" || !candidate.company.lastEnrichedAt) return 1;
    return 2;
  }
  const prioritizedCandidates = [...candidates].sort((a, b) => emailCandidatePriority(a) - emailCandidatePriority(b));

  const bodyTemplate = await getEmailBodyTemplate();
  const defaultAttachments = await getEmailTemplateAttachmentForSend();
  let sent = 0;
  let failed = 0;
  let candidatesChecked = 0;
  let withoutEmail = 0;
  for (const candidate of prioritizedCandidates) {
    if (sent >= remaining) break;
    candidatesChecked += 1;
    try {
      let refreshed = candidate;
      if (!candidate.company.contactEmail) {
        const lead = await enrichOpportunityLead(candidate.id);
        if (!lead.contactEmail) {
          withoutEmail += 1;
          continue;
        }
        refreshed = await prisma.opportunity.findUniqueOrThrow({
          where: { id: candidate.id },
          include: { company: true, game: true, outreachMessages: true }
        });
      }
      const result = await sendLeadEmail(refreshed, { subjectTemplate: emailSubjectTemplate, bodyTemplate, attachments: defaultAttachments });
      const draft = emailForOpportunityWithTemplate(refreshed, { subjectTemplate: emailSubjectTemplate, bodyTemplate });
      if (result.draftId) {
        await prisma.outreachMessage.update({
          where: { id: result.draftId },
          data: { status: "sent", subject: result.subject, body: result.body }
        });
      } else {
        await prisma.outreachMessage.create({
          data: {
            opportunityId: refreshed.id,
            channel: "email",
            language: "en",
            subject: draft.subject,
            body: draft.body,
            status: "sent"
          }
        });
      }
      sent += 1;
    } catch (error) {
      failed += 1;
      await prisma.systemLog.create({
        data: {
          level: "warning",
          module: "email",
          message: `Automatic email failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          metadata: JSON.stringify({ opportunityId: candidate.id })
        }
      });
    }
  }

  return {
    skipped: sent === 0 && failed === 0,
    reason: sent === 0 && failed === 0 ? "no_email_ready_leads" : undefined,
    sent,
    failed,
    candidatesChecked,
    withoutEmail
  };
}
