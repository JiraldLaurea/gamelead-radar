import { redirectTo } from "@/lib/http";
import { disableAutomationStatus, ensureAutomationRunning } from "@/lib/automation-runner";
import {
  normalizeArticleCrawlLimit,
  normalizeDailyLimit,
  normalizeLeadAnalysisLimit,
  normalizeTimeValue,
  saveOperationsSettings
} from "@/lib/operations-settings";

export async function POST(request: Request) {
  const formData = await request.formData();
  const settings = await saveOperationsSettings({
    autoEmailEnabled: formData.get("autoEmailEnabled") === "on",
    autoEmailScheduleEnabled: formData.get("autoEmailScheduleEnabled") === "on",
    autoEmailScheduleStart: normalizeTimeValue(String(formData.get("autoEmailScheduleStart") ?? ""), "20:00"),
    autoEmailScheduleEnd: normalizeTimeValue(String(formData.get("autoEmailScheduleEnd") ?? ""), "00:00"),
    autoEmailDailyLimit: normalizeDailyLimit(String(formData.get("autoEmailDailyLimit") ?? "")),
    maxArticleCrawlLimit: normalizeArticleCrawlLimit(String(formData.get("maxArticleCrawlLimit") ?? "")),
    maxLeadAnalysisLimit: normalizeLeadAnalysisLimit(String(formData.get("maxLeadAnalysisLimit") ?? ""))
  });
  if (settings.autoEmailEnabled) {
    await ensureAutomationRunning("settings save");
  } else {
    await disableAutomationStatus();
  }

  return redirectTo("/settings?operations=saved");
}
