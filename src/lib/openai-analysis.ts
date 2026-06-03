import { aiAnalysisSchema, analyzeArticleHeuristically, type AiAnalysis } from "./analysis";
import { getFullArticleContent } from "./article-content";

type ArticleForAnalysis = {
  title: string;
  url: string;
  rawContent: string;
  publishedAt?: Date | null;
  source?: {
    name?: string;
    region?: string;
    language?: string;
    sourceType?: string;
  };
};

const systemPrompt = `You are a senior game industry business development analyst for QROAD, a game service outsourcing company.

Analyze game industry news and determine whether it creates a sales opportunity for QROAD's outsourcing services.

QROAD service packages:
1. Pre-Launch QA Package
2. Store & Platform QA Package
3. Global Launch Localization Package
4. Launch Operation Support Package
5. Pre-Registration Marketing Package
6. Game Creative Production Package
7. AI Community & CS Monitoring Package

Target scope:
- Countries: Korea, Japan, North America only.
- Company type: game developers or publishers directly connected to the game.
- Platforms: Steam and mobile games first.
- Sales timing: pre-launch, beta, soft launch, pre-registration, global/regional launch, new platform launch, relaunch, or expansion before release.
- Exclude post-launch-only news unless there is a new region/platform/global release, relaunch, expansion, beta, or pre-registration opportunity.

Display-name rules:
- Return company.name and game.title in English or official romanized form whenever available.
- If the article uses Japanese/Korean names, translate or romanize the display name, but do not invent an unknown company.
- Examples: "セガ" -> "Sega", "ポケットモンスター" -> "Pokemon", "ドットアビス" -> "Dot Abyss".
- Return evidence.key_quotes in English. If the source evidence is Japanese or Korean, translate or summarize it in English instead of returning original-language text.

Return strict JSON only. Do not include markdown or explanations outside JSON.`;

export async function analyzeArticle(article: ArticleForAnalysis): Promise<{
  analysis: AiAnalysis;
  provider: "openai" | "heuristic";
  fullContent: string;
  error?: string;
}> {
  const fullContent = await getFullArticleContent(article);

  if (!process.env.OPENAI_API_KEY) {
    return {
      analysis: analyzeArticleHeuristically({ ...article, rawContent: fullContent }),
      provider: "heuristic",
      fullContent,
      error: "OPENAI_API_KEY is not configured"
    };
  }

  try {
    const analysis = await analyzeWithOpenAI(article, fullContent);
    return { analysis, provider: "openai", fullContent };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OpenAI analysis error";
    return {
      analysis: analyzeArticleHeuristically({ ...article, rawContent: fullContent }),
      provider: "heuristic",
      fullContent,
      error: message
    };
  }
}

async function analyzeWithOpenAI(article: ArticleForAnalysis, fullContent: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: buildUserPrompt(article, fullContent)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "gamelead_article_analysis",
          schema: analysisJsonSchema,
          strict: false
        }
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API ${response.status}: ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  const text = extractResponseText(data);
  if (!text) throw new Error("OpenAI response did not include output text");
  return aiAnalysisSchema.parse(normalizeAnalysisJson(JSON.parse(text)));
}

function normalizeAnalysisJson(value: unknown) {
  const analysis = value as {
    game?: { expected_launch_date?: string | null };
    evidence?: { detected_keywords?: string[] };
    exclusion_reason?: string | null;
    uncertainty?: string | null;
  };
  if (analysis.game && !("expected_launch_date" in analysis.game)) {
    analysis.game.expected_launch_date = null;
  }
  if (!("exclusion_reason" in analysis)) analysis.exclusion_reason = null;
  if (!("uncertainty" in analysis)) analysis.uncertainty = null;
  if (analysis.evidence && !("detected_keywords" in analysis.evidence)) {
    analysis.evidence.detected_keywords = [];
  }
  return analysis;
}

function buildUserPrompt(article: ArticleForAnalysis, fullContent: string) {
  return `Analyze the following article and decide whether it is a valid QROAD sales lead.

Source metadata:
Source: ${article.source?.name ?? "Unknown"}
Source region: ${article.source?.region ?? "Unknown"}
Source language: ${article.source?.language ?? "Unknown"}
Source type: ${article.source?.sourceType ?? "Unknown"}

Article:
Title: ${article.title}
URL: ${article.url}
Published at: ${article.publishedAt?.toISOString() ?? "Unknown"}
Content:
${fullContent}

Required:
1. Identify company, country, company type, game title, platform, and launch stage.
   Use English or official romanized display names for company.name and game.title.
2. Decide whether the company is a developer or publisher directly connected to the game service.
3. Decide whether the opportunity is pre-launch or a new launch opportunity.
4. Exclude post-launch-only, review-only, rumor-only, or non-target-region articles.
5. Match suitable QROAD service packages.
6. Provide concise evidence points in English. Translate or summarize source-language evidence when needed.
7. Assign a score and grade.
8. Return strict JSON only.`;
}

function extractResponseText(data: unknown) {
  const maybe = data as { output_text?: string; output?: Array<{ content?: Array<{ text?: string; type?: string }> }> };
  if (maybe.output_text) return maybe.output_text;
  return maybe.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");
}

const analysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["is_relevant", "relevance_reason", "exclusion_reason", "company", "game", "opportunity", "evidence", "uncertainty"],
  properties: {
    is_relevant: { type: "boolean" },
    relevance_reason: { type: "string" },
    exclusion_reason: { type: ["string", "null"] },
    company: {
      type: "object",
      additionalProperties: false,
      required: ["name", "country", "company_type", "is_direct_service_owner"],
      properties: {
        name: { type: "string" },
        country: { enum: ["Korea", "Japan", "USA", "Canada", "Unknown"] },
        company_type: { enum: ["developer", "publisher", "developer_publisher", "media", "platform", "investor", "unknown"] },
        is_direct_service_owner: { type: "boolean" }
      }
    },
    game: {
      type: "object",
      additionalProperties: false,
      required: ["title", "platforms", "genre", "launch_stage", "expected_launch_date"],
      properties: {
        title: { type: "string" },
        platforms: { type: "array", items: { type: "string" } },
        genre: { type: "string" },
        launch_stage: { type: "string" },
        expected_launch_date: { type: ["string", "null"] }
      }
    },
    opportunity: {
      type: "object",
      additionalProperties: false,
      required: ["opportunity_type", "is_pre_launch_or_new_launch", "recommended_packages", "score", "grade", "next_action"],
      properties: {
        opportunity_type: { type: "string" },
        is_pre_launch_or_new_launch: { type: "boolean" },
        recommended_packages: {
          type: "array",
          items: {
            enum: [
              "Pre-Launch QA Package",
              "Store & Platform QA Package",
              "Global Launch Localization Package",
              "Launch Operation Support Package",
              "Pre-Registration Marketing Package",
              "Game Creative Production Package",
              "AI Community & CS Monitoring Package"
            ]
          }
        },
        score: { type: "integer" },
        grade: { enum: ["A", "B", "C", "D"] },
        next_action: { type: "string" }
      }
    },
    evidence: {
      type: "object",
      additionalProperties: false,
      required: ["key_quotes", "detected_keywords"],
      properties: {
        key_quotes: { type: "array", items: { type: "string" } },
        detected_keywords: { type: "array", items: { type: "string" } }
      }
    },
    uncertainty: { type: ["string", "null"] }
  }
};
