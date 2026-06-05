import { ensureTestAutomationRunning } from "@/lib/automation-runner";
import { redirectTo } from "@/lib/http";

export async function POST() {
  await ensureTestAutomationRunning();
  return redirectTo("/settings?testEmail=started");
}
