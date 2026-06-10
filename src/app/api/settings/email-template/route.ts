import { z } from "zod";
import {
  clearEmailTemplateAttachment,
  getEmailTemplateAttachment,
  saveEmailBodyTemplate,
  saveEmailTemplateAttachment
} from "@/lib/email-template";

const schema = z.object({
  body: z.string().trim().min(1).max(5000)
});

const maxAttachmentSize = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    return saveMultipartTemplate(request);
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ success: false, error: "Invalid email template", details: parsed.error.flatten() }, { status: 400 });
  }

  const setting = await saveEmailBodyTemplate(parsed.data.body);
  return Response.json({ success: true, body: setting.value, attachment: await getEmailTemplateAttachment() });
}

async function saveMultipartTemplate(request: Request) {
  const formData = await request.formData();
  const parsed = schema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return Response.json({ success: false, error: "Invalid email template", details: parsed.error.flatten() }, { status: 400 });
  }

  const file = formData.get("defaultAttachment");
  if (file instanceof File && file.size > 0) {
    if (file.size > maxAttachmentSize) {
      return Response.json({ success: false, error: "Default attachment must be 10MB or smaller." }, { status: 400 });
    }
    await saveEmailTemplateAttachment(file);
  } else if (formData.get("removeDefaultAttachment") === "true") {
    await clearEmailTemplateAttachment();
  }

  const setting = await saveEmailBodyTemplate(parsed.data.body);
  return Response.json({ success: true, body: setting.value, attachment: await getEmailTemplateAttachment() });
}
