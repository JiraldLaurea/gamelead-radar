import { prisma } from "@/lib/prisma";
import { defaultEmailBodyTemplate } from "@/lib/email-template-defaults";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const emailBodySettingKey = "email_template_body";
const emailAttachmentSettingKey = "email_template_default_attachment";
const attachmentDirectory = path.join(process.cwd(), ".data", "email-template-attachments");

export type EmailTemplateAttachment = {
  filename: string;
  path: string;
  contentType?: string;
  size: number;
};

export async function getEmailBodyTemplate() {
  const setting = await prisma.appSetting.findUnique({ where: { key: emailBodySettingKey } });
  return setting?.value || defaultEmailBodyTemplate;
}

export async function saveEmailBodyTemplate(value: string) {
  return prisma.appSetting.upsert({
    where: { key: emailBodySettingKey },
    create: { key: emailBodySettingKey, value },
    update: { value }
  });
}

export async function getEmailTemplateAttachment() {
  const setting = await prisma.appSetting.findUnique({ where: { key: emailAttachmentSettingKey } });
  if (!setting?.value) return null;

  try {
    return JSON.parse(setting.value) as EmailTemplateAttachment;
  } catch {
    return null;
  }
}

export async function saveEmailTemplateAttachment(file: File) {
  await mkdir(attachmentDirectory, { recursive: true });
  const existing = await getEmailTemplateAttachment();
  if (existing) {
    await removeStoredAttachment(existing);
  }

  const filename = sanitizeFilename(file.name || "attachment");
  const storedFilename = `${Date.now()}-${filename}`;
  const storedPath = path.join(attachmentDirectory, storedFilename);
  await writeFile(storedPath, Buffer.from(await file.arrayBuffer()));

  const attachment: EmailTemplateAttachment = {
    filename,
    path: storedPath,
    contentType: file.type || undefined,
    size: file.size
  };

  await prisma.appSetting.upsert({
    where: { key: emailAttachmentSettingKey },
    create: { key: emailAttachmentSettingKey, value: JSON.stringify(attachment) },
    update: { value: JSON.stringify(attachment) }
  });

  return attachment;
}

export async function clearEmailTemplateAttachment() {
  const existing = await getEmailTemplateAttachment();
  if (existing) {
    await removeStoredAttachment(existing);
  }
  await prisma.appSetting.deleteMany({ where: { key: emailAttachmentSettingKey } });
}

export async function getEmailTemplateAttachmentForSend() {
  const attachment = await getEmailTemplateAttachment();
  if (!attachment) return [];

  try {
    return [
      {
        filename: attachment.filename,
        content: await readFile(attachment.path),
        contentType: attachment.contentType
      }
    ];
  } catch {
    return [];
  }
}

async function removeStoredAttachment(attachment: EmailTemplateAttachment) {
  try {
    await unlink(attachment.path);
  } catch {
    // Missing local attachment files should not block template updates.
  }
}

function sanitizeFilename(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").slice(0, 180) || "attachment";
}
