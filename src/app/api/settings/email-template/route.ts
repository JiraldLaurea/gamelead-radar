import { z } from "zod";
import { saveEmailBodyTemplate } from "@/lib/email-template";

const schema = z.object({
  body: z.string().trim().min(1).max(5000)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ success: false, error: "Invalid email template", details: parsed.error.flatten() }, { status: 400 });
  }

  const setting = await saveEmailBodyTemplate(parsed.data.body);
  return Response.json({ success: true, body: setting.value });
}
