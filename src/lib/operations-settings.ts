import { prisma } from "@/lib/prisma";

export const autoEmailEnabledSettingKey = "auto_email_enabled";
export const autoEmailDailyLimitSettingKey = "auto_email_daily_limit";
export const maxArticleCrawlLimitSettingKey = "max_article_crawl_limit";
export const maxLeadAnalysisLimitSettingKey = "max_lead_analysis_limit";

const defaultDailyLimit = 10;
const minDailyLimit = 1;
const maxDailyLimit = 10;
const defaultArticleCrawlLimit = 100;
const defaultLeadAnalysisLimit = 10;
const minProcessingLimit = 1;
const maxArticleCrawlLimit = 100;
const maxLeadAnalysisLimit = 10;

export type OperationsSettings = {
  autoEmailEnabled: boolean;
  autoEmailDailyLimit: number;
  maxArticleCrawlLimit: number;
  maxLeadAnalysisLimit: number;
};

export async function getOperationsSettings(): Promise<OperationsSettings> {
  const settings = await prisma.appSetting.findMany({
    where: {
      key: {
        in: [
          autoEmailEnabledSettingKey,
          autoEmailDailyLimitSettingKey,
          maxArticleCrawlLimitSettingKey,
          maxLeadAnalysisLimitSettingKey
        ]
      }
    }
  });
  const values = new Map(settings.map((setting) => [setting.key, setting.value]));

  return {
    autoEmailEnabled: values.get(autoEmailEnabledSettingKey) === "true",
    autoEmailDailyLimit: normalizeDailyLimit(values.get(autoEmailDailyLimitSettingKey)),
    maxArticleCrawlLimit: normalizeArticleCrawlLimit(values.get(maxArticleCrawlLimitSettingKey)),
    maxLeadAnalysisLimit: normalizeLeadAnalysisLimit(values.get(maxLeadAnalysisLimitSettingKey))
  };
}

export async function saveOperationsSettings(input: OperationsSettings) {
  const autoEmailDailyLimit = normalizeDailyLimit(String(input.autoEmailDailyLimit));
  const maxArticleCrawlLimit = normalizeArticleCrawlLimit(String(input.maxArticleCrawlLimit));
  const maxLeadAnalysisLimit = normalizeLeadAnalysisLimit(String(input.maxLeadAnalysisLimit));
  await prisma.$transaction([
    prisma.appSetting.upsert({
      where: { key: autoEmailEnabledSettingKey },
      create: { key: autoEmailEnabledSettingKey, value: input.autoEmailEnabled ? "true" : "false" },
      update: { value: input.autoEmailEnabled ? "true" : "false" }
    }),
    prisma.appSetting.upsert({
      where: { key: autoEmailDailyLimitSettingKey },
      create: { key: autoEmailDailyLimitSettingKey, value: String(autoEmailDailyLimit) },
      update: { value: String(autoEmailDailyLimit) }
    }),
    prisma.appSetting.upsert({
      where: { key: maxArticleCrawlLimitSettingKey },
      create: { key: maxArticleCrawlLimitSettingKey, value: String(maxArticleCrawlLimit) },
      update: { value: String(maxArticleCrawlLimit) }
    }),
    prisma.appSetting.upsert({
      where: { key: maxLeadAnalysisLimitSettingKey },
      create: { key: maxLeadAnalysisLimitSettingKey, value: String(maxLeadAnalysisLimit) },
      update: { value: String(maxLeadAnalysisLimit) }
    })
  ]);

  return { autoEmailEnabled: input.autoEmailEnabled, autoEmailDailyLimit, maxArticleCrawlLimit, maxLeadAnalysisLimit };
}

export function normalizeDailyLimit(value?: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultDailyLimit;
  return Math.min(maxDailyLimit, Math.max(minDailyLimit, Math.floor(parsed)));
}

export function normalizeArticleCrawlLimit(value?: string | null) {
  return normalizeProcessingLimit(value, defaultArticleCrawlLimit, maxArticleCrawlLimit);
}

export function normalizeLeadAnalysisLimit(value?: string | null) {
  return normalizeProcessingLimit(value, defaultLeadAnalysisLimit, maxLeadAnalysisLimit);
}

function normalizeProcessingLimit(value: string | null | undefined, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(minProcessingLimit, Math.floor(parsed)));
}
