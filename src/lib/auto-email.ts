import { emailSubjectTemplate } from "@/lib/email-template-defaults";
import { getEmailBodyTemplate } from "@/lib/email-template";
import { enrichOpportunityLead } from "@/lib/lead-enrichment";
import { emailForOpportunityWithTemplate, sendLeadEmail, smtpConfigured } from "@/lib/mailer";
import { getOperationsSettings } from "@/lib/operations-settings";
import { prisma } from "@/lib/prisma";

export async function runAutomaticEmailPass() {
  const settings = await getOperationsSettings();
  if (!settings.autoEmailEnabled) {
    return { skipped: true, reason: "disabled", sent: 0, failed: 0 };
  }

  if (!smtpConfigured()) {
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

  const bodyTemplate = await getEmailBodyTemplate();
  let sent = 0;
  let failed = 0;
  for (const candidate of candidates) {
    if (sent >= remaining) break;
    try {
      const lead = await enrichOpportunityLead(candidate.id);
      if (!lead.contactEmail) continue;
      const refreshed = await prisma.opportunity.findUniqueOrThrow({
        where: { id: candidate.id },
        include: { company: true, game: true, outreachMessages: true }
      });
      const result = await sendLeadEmail(refreshed, { subjectTemplate: emailSubjectTemplate, bodyTemplate });
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

  return { skipped: false, sent, failed };
}
