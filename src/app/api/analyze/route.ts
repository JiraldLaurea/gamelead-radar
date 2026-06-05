import { runAutomaticEmailPass } from "@/lib/auto-email";
import { redirectTo } from "@/lib/http";
import { analyzePendingArticles } from "@/lib/lead-analysis-runner";
import { getOperationsSettings } from "@/lib/operations-settings";

export async function GET() {
  return redirectTo("/");
}

export async function POST() {
  const settings = await getOperationsSettings();
  const analysis = await analyzePendingArticles(settings.maxLeadAnalysisLimit);

  const autoEmail = await runAutomaticEmailPass();
  const params = new URLSearchParams({ analyzed: String(analysis.analyzed), analysisFailed: String(analysis.failed) });
  if (!autoEmail.skipped || autoEmail.reason) {
    params.set("autoEmailSent", String(autoEmail.sent));
    params.set("autoEmailFailed", String(autoEmail.failed));
    if (autoEmail.reason) params.set("autoEmail", autoEmail.reason);
  }

  return redirectTo(`/leads?${params.toString()}`);
}
