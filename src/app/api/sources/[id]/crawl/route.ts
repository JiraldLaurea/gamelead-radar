import { crawlSingleSource } from "@/lib/crawler";
import { redirectTo } from "@/lib/http";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await crawlSingleSource(id);
  return redirectTo("/sources");
}
