import { crawlActiveSources } from "@/lib/crawler";
import { redirectTo } from "@/lib/http";
import { getOperationsSettings } from "@/lib/operations-settings";

export async function POST() {
  const settings = await getOperationsSettings();
  await crawlActiveSources({ maxArticles: settings.maxArticleCrawlLimit });
  return redirectTo("/");
}
