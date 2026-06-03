import keywords from "../../seed/source-keywords.json";

type ArticleLike = {
  title: string;
  rawContent: string;
  language?: string | null;
};

export function shouldAnalyzeArticle(article: ArticleLike): { action: "analyze" | "needs_research" | "exclude"; reason?: string } {
  const language = normalizeLanguage(article.language);
  const text = `${article.title}\n${article.rawContent}`.toLowerCase();
  const include = keywords[language].include.map((item) => item.toLowerCase());
  const exclude = keywords[language].exclude.map((item) => item.toLowerCase());
  const hasInclude = include.some((word) => text.includes(word));
  const hasExclude = exclude.some((word) => text.includes(word));

  if (hasInclude && hasExclude) {
    return { action: "needs_research", reason: "Article matched both include and exclude pre-filter keywords." };
  }
  if (hasInclude) {
    return { action: "analyze" };
  }
  if (hasExclude) {
    return { action: "exclude", reason: "Article matched exclude pre-filter keywords without a lead signal." };
  }
  return { action: "needs_research", reason: "No source pre-filter lead signal was detected." };
}

function normalizeLanguage(language?: string | null): "en" | "ko" | "ja" {
  if (language === "ko" || language === "ja") return language;
  return "en";
}
