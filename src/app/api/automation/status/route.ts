import { ensureAutomationRunning, getAutomationStatus } from "@/lib/automation-runner";

export async function GET() {
  await ensureAutomationRunning("status check");
  return Response.json(await getAutomationStatus());
}
