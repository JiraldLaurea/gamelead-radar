import { redirectTo } from "@/lib/http";

export async function POST() {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX ?? process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cx) {
    return redirectTo("/settings?googleSearch=missing");
  }

  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", "Nintendo official website");
    url.searchParams.set("num", "1");

    const response = await fetch(url, {
      signal: AbortSignal.timeout(Number(process.env.WEBSITE_DISCOVERY_TIMEOUT_MS ?? 10000))
    });

    if (!response.ok) {
      const reason = await googleErrorReason(response);
      return redirectTo(`/settings?googleSearch=failed&status=${response.status}${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`);
    }

    const data = (await response.json()) as { items?: unknown[] };
    return redirectTo(`/settings?googleSearch=${data.items?.length ? "success" : "empty"}`);
  } catch {
    return redirectTo("/settings?googleSearch=failed");
  }
}

async function googleErrorReason(response: Response) {
  try {
    const data = (await response.json()) as { error?: { status?: string; message?: string } };
    return data.error?.status ?? data.error?.message ?? null;
  } catch {
    return null;
  }
}
