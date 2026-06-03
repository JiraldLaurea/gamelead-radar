import { redirectTo } from "@/lib/http";

export async function POST() {
  const apiKey = process.env.SERPAPI_API_KEY ?? process.env.SEARCH_API_KEY;

  if (!apiKey) {
    return redirectTo("/settings?serpapi=missing");
  }

  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", "Nintendo official website");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("num", "1");

    const response = await fetch(url, {
      signal: AbortSignal.timeout(Number(process.env.WEBSITE_DISCOVERY_TIMEOUT_MS ?? 10000))
    });

    if (!response.ok) {
      return redirectTo(`/settings?serpapi=failed&status=${response.status}`);
    }

    const data = (await response.json()) as { organic_results?: unknown[]; error?: string };
    if (data.error) return redirectTo(`/settings?serpapi=failed&reason=${encodeURIComponent(data.error)}`);

    return redirectTo(`/settings?serpapi=${data.organic_results?.length ? "success" : "empty"}`);
  } catch {
    return redirectTo("/settings?serpapi=failed");
  }
}
