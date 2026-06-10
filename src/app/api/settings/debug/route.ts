import { redirectTo } from "@/lib/http";
import { saveDebugSettings } from "@/lib/operations-settings";

export async function POST(request: Request) {
  const formData = await request.formData();
  await saveDebugSettings({
    disableActualEmailSending: formData.get("disableActualEmailSending") === "on"
  });

  return redirectTo("/settings?debug=saved");
}
