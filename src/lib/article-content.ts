import * as cheerio from "cheerio";
import { crawlerHeaders } from "./source-validation";

export async function getFullArticleContent(article: {
  title: string;
  url: string;
  rawContent: string;
}) {
  try {
    const response = await fetch(article.url, {
      headers: crawlerHeaders(),
      signal: AbortSignal.timeout(Number(process.env.ARTICLE_FETCH_TIMEOUT_MS ?? 12_000))
    });
    if (!response.ok) return article.rawContent;

    const html = await response.text();
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header, aside, iframe, noscript, .ad, .ads, .related, .recommend").remove();
    const content =
      $("article").text() ||
      $('[class*="article"], [class*="content"], [id*="article"], [id*="content"]').first().text() ||
      $("body").text();
    const normalized = content.replace(/\s+/g, " ").trim();

    if (normalized.length < article.rawContent.length) return article.rawContent;
    return normalized.slice(0, Number(process.env.MAX_FULL_ARTICLE_CHARS ?? 12000));
  } catch {
    return article.rawContent;
  }
}
