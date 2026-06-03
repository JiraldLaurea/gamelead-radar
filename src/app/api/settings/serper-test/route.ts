import { redirectTo } from "@/lib/http";

export async function POST() {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    return redirectTo("/settings?serper=missing");
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey
      },
      body: JSON.stringify({ q: "Nintendo official website", num: 1 }),
      signal: AbortSignal.timeout(Number(process.env.WEBSITE_DISCOVERY_TIMEOUT_MS ?? 10000))
    });

    if (!response.ok) {
      const reason = await serperErrorReason(response);
      return redirectTo(`/settings?serper=failed&status=${response.status}${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`);
    }

    const data = (await response.json()) as { organic?: unknown[] };
    return redirectTo(`/settings?serper=${data.organic?.length ? "success" : "empty"}`);
  } catch {
    return redirectTo("/settings?serper=failed");
  }
}

async function serperErrorReason(response: Response) {
  try {
    const data = (await response.json()) as { message?: string; error?: string };
    return data.message ?? data.error ?? null;
  } catch {
    return null;
  }
}
