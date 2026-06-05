import { requestAutomationCancel } from "@/lib/automation-runner";

export async function POST() {
  return Response.json(await requestAutomationCancel());
}
