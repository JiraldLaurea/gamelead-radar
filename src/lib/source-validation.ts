import Parser from "rss-parser";
import * as cheerio from "cheerio";
import type { Source } from "@prisma/client";
import { prisma } from "./prisma";

export const sourceTypes = [
  "rss",
  "rss_autodiscovery",
  "html_news_list",
  "html_article",
  "steam_news_feed",
  "steam_app_rss",
  "steam_upcoming_html",
  "youtube_channel_rss",
  "appstore_rss",
  "google_play_html",
  "official_press",
  "website",
  "steam",
  "official"
] as const;

export type SourceValidationResult = {
  status: "ok" | "warning" | "failed" | "needs_review";
  itemCount: number;
  latestPublishedAt: Date | null;
  sampleTitle: string | null;
  sampleUrl: string | null;
  resolvedFeedUrl?: string | null;
  error?: string | null;
  robotsAllowed?: boolean | null;
};

const parser = new Parser({
  headers: crawlerHeaders()
});

export function crawlerHeaders() {
  return {
    "User-Agent": process.env.CRAWLER_USER_AGENT ?? "GameLeadRadarBot/0.1 (+local use)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8"
  };
}

export async function verifySource(source: Source, persist = true): Promise<SourceValidationResult> {
  try {
    const result = await runVerification(source);
    if (persist) {
      await prisma.source.update({
        where: { id: source.id },
        data: {
          resolvedFeedUrl: result.resolvedFeedUrl ?? source.resolvedFeedUrl,
          verificationStatus: result.status,
          verificationError: result.error ?? null,
          lastVerifiedAt: new Date(),
          consecutiveFailures: result.status === "failed" || result.status === "needs_review" ? source.consecutiveFailures + 1 : 0,
          active:
            source.active && source.consecutiveFailures + 1 >= Number(process.env.AUTO_DISABLE_AFTER_FAILURES ?? 3)
              ? false
              : source.active
        }
      });
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown verification error";
    const consecutiveFailures = source.consecutiveFailures + 1;
    if (persist) {
      await prisma.source.update({
        where: { id: source.id },
        data: {
          verificationStatus: "needs_review",
          verificationError: message,
          lastVerifiedAt: new Date(),
          consecutiveFailures,
          active: consecutiveFailures >= Number(process.env.AUTO_DISABLE_AFTER_FAILURES ?? 3) ? false : source.active
        }
      });
      await prisma.systemLog.create({
        data: {
          level: "warning",
          module: "source-validation",
          message: `${source.name}: ${message}`,
          metadata: JSON.stringify({ sourceId: source.id, url: source.url })
        }
      });
    }
    return {
      status: "needs_review",
      itemCount: 0,
      latestPublishedAt: null,
      sampleTitle: null,
      sampleUrl: null,
      error: message
    };
  }
}

export async function discoverRss(source: Source, persist = true) {
  const candidates = await discoverRssCandidates(source.url);
  for (const candidate of candidates) {
    const result = await validateRssUrl(candidate);
    if (result.status === "ok" || result.status === "warning") {
      if (persist) {
        await prisma.source.update({
          where: { id: source.id },
          data: {
            resolvedFeedUrl: candidate,
            sourceType: source.sourceType === "rss_autodiscovery" ? source.sourceType : "rss_autodiscovery",
            verificationStatus: result.status,
            verificationError: null,
            lastVerifiedAt: new Date(),
            consecutiveFailures: 0
          }
        });
      }
      return { ...result, resolvedFeedUrl: candidate };
    }
  }

  const result: SourceValidationResult = {
    status: "needs_review",
    itemCount: 0,
    latestPublishedAt: null,
    sampleTitle: null,
    sampleUrl: null,
    error: "No valid RSS/Atom alternate feed found"
  };
  if (persist) {
    await prisma.source.update({
      where: { id: source.id },
      data: {
        verificationStatus: result.status,
        verificationError: result.error,
        lastVerifiedAt: new Date(),
        consecutiveFailures: source.consecutiveFailures + 1
      }
    });
  }
  return result;
}

export async function discoverRssCandidates(pageUrl: string) {
  const response = await fetchWithTimeout(pageUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const html = await response.text();
  const $ = cheerio.load(html);
  return $('link[rel~="alternate"]')
    .map((_, element) => {
      const type = ($(element).attr("type") ?? "").toLowerCase();
      const href = $(element).attr("href");
      if (!href || (!type.includes("rss") && !type.includes("atom") && !type.includes("xml"))) return null;
      return new URL(href, pageUrl).toString();
    })
    .get()
    .filter(Boolean);
}

async function runVerification(source: Source): Promise<SourceValidationResult> {
  if (["rss_autodiscovery"].includes(source.sourceType) && !source.resolvedFeedUrl) {
    return discoverRss(source, false);
  }

  if (["rss", "rss_autodiscovery", "steam_news_feed", "steam_app_rss", "youtube_channel_rss", "appstore_rss"].includes(source.sourceType)) {
    return validateRssUrl(source.resolvedFeedUrl ?? source.url);
  }

  return validateHtmlUrl(source.url, source.sourceType);
}

export async function validateRssUrl(url: string): Promise<SourceValidationResult> {
  const response = await fetchWithTimeout(url);
  const xml = await response.text();
  const feed = await parser.parseString(xml);
  const items = feed.items ?? [];
  if (items.length === 0) {
    return {
      status: "failed",
      itemCount: 0,
      latestPublishedAt: null,
      sampleTitle: null,
      sampleUrl: null,
      error: "Feed parsed but no items were found"
    };
  }

  const latestPublishedAt = latestDate(items.map((item) => item.isoDate ?? item.pubDate ?? null));
  const recencyDays = Number(process.env.ARTICLE_RECENCY_DAYS ?? 90);
  const status =
    latestPublishedAt && Date.now() - latestPublishedAt.getTime() > recencyDays * 24 * 60 * 60 * 1000 ? "warning" : "ok";

  return {
    status,
    itemCount: items.length,
    latestPublishedAt,
    sampleTitle: items[0].title ?? null,
    sampleUrl: items[0].link ?? null,
    error: status === "warning" ? `Latest item is older than ${recencyDays} days` : null
  };
}

async function validateHtmlUrl(url: string, sourceType: string): Promise<SourceValidationResult> {
  const [response, robotsAllowed] = await Promise.all([fetchWithTimeout(url), checkRobots(url)]);
  if (!response.ok) {
    return {
      status: "failed",
      itemCount: 0,
      latestPublishedAt: null,
      sampleTitle: null,
      sampleUrl: null,
      robotsAllowed,
      error: `HTTP ${response.status}`
    };
  }
  const html = await response.text();
  const $ = cheerio.load(html);
  const links = extractHtmlLinks($, url, sourceType);
  return {
    status: links.length > 0 ? "warning" : "needs_review",
    itemCount: links.length,
    latestPublishedAt: null,
    sampleTitle: links[0]?.title ?? null,
    sampleUrl: links[0]?.url ?? null,
    robotsAllowed,
    error: links.length > 0 ? "HTML source needs selector/manual review before production use" : "No article links found"
  };
}

export function extractHtmlLinks($: cheerio.CheerioAPI, baseUrl: string, sourceType = "html_news_list") {
  if (sourceType === "steam_upcoming_html") {
    return $("a.search_result_row")
      .slice(0, 50)
      .map((_, element) => ({
        title: $(element).find(".title").text().trim(),
        url: new URL($(element).attr("href") ?? "/", baseUrl).toString(),
        summary: $(element).find(".search_released").text().trim()
      }))
      .get()
      .filter((item) => item.title && item.url);
  }

  return $("article a, .news-list a, .list_item a, a")
    .slice(0, 40)
    .map((_, element) => {
      const title = $(element).text().trim().replace(/\s+/g, " ");
      const href = $(element).attr("href");
      if (!href || title.length < 12) return null;
      return { title, url: new URL(href, baseUrl).toString(), summary: title };
    })
    .get()
    .filter(Boolean);
}

async function checkRobots(url: string) {
  try {
    const parsed = new URL(url);
    const robotsUrl = `${parsed.origin}/robots.txt`;
    const response = await fetchWithTimeout(robotsUrl, 5000);
    if (!response.ok) return null;
    const text = await response.text();
    const disallowAll = /user-agent:\s*\*[\s\S]*?disallow:\s*\/\s*(?:\r?\n|$)/i.test(text);
    return !disallowAll;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 10_000) {
  const response = await fetch(url, {
    headers: crawlerHeaders(),
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response;
}

function latestDate(values: Array<string | null>) {
  const dates = values
    .map((value) => (value ? new Date(value) : null))
    .filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());
  return dates[0] ?? null;
}
