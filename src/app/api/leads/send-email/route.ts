import { z } from "zod";
import { emailForOpportunityWithTemplate, sendLeadEmail, smtpConfigured } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1).max(50),
  subject: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(5000)
});

export async function POST(request: Request) {
  const body = requestSchema.safeParse(await request.json());
  if (!body.success) {
    return Response.json({ success: false, error: "Invalid email request", details: body.error.flatten() }, { status: 400 });
  }

  if (!smtpConfigured()) {
    return Response.json(
      { success: false, error: "SMTP is not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS, and optional SMTP_PORT/SMTP_FROM." },
      { status: 400 }
    );
  }

  const leadIds = [...new Set(body.data.leadIds)];
  const leads = await prisma.opportunity.findMany({
    where: {
      id: { in: leadIds },
      company: { contactEmail: { not: null } }
    },
    include: { company: true, game: true, outreachMessages: true }
  });

  if (leads.length === 0) {
    return Response.json({ success: false, error: "No selected leads have a contact email address." }, { status: 400 });
  }

  const results = [];
  for (const lead of leads) {
    try {
      const sent = await sendLeadEmail(lead, {
        subjectTemplate: body.data.subject,
        bodyTemplate: body.data.body
      });
      const draft = emailForOpportunityWithTemplate(lead, {
        subjectTemplate: body.data.subject,
        bodyTemplate: body.data.body
      });
      const message = sent.draftId
        ? await prisma.outreachMessage.update({
            where: { id: sent.draftId },
            data: { status: "sent", subject: sent.subject, body: sent.body }
          })
        : await prisma.outreachMessage.create({
            data: {
              opportunityId: lead.id,
              channel: "email",
              language: "en",
              subject: draft.subject,
              body: draft.body,
              status: "sent"
            }
          });

      results.push({ id: lead.id, email: sent.recipient, sent: true, messageId: message.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send email";
      await prisma.systemLog.create({
        data: {
          level: "warning",
          module: "email",
          message: `Email send failed for ${lead.company.name}: ${message}`,
          metadata: JSON.stringify({ opportunityId: lead.id, companyId: lead.companyId, email: lead.company.contactEmail })
        }
      });
      results.push({ id: lead.id, email: lead.company.contactEmail, sent: false, error: message });
    }
  }

  const sent = results.filter((result) => result.sent).length;
  const failed = results.length - sent;
  if (sent === 0) {
    return Response.json({ success: false, error: "Email sending failed.", sent, failed, results }, { status: 500 });
  }

  return Response.json({ success: true, sent, failed, results });
}
