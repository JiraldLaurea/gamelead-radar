import { crawlActiveSources } from "@/lib/crawler";
import { redirectTo } from "@/lib/http";

export async function POST() {
  await crawlActiveSources();
  return redirectTo("/");
}
