import { prisma } from "@/lib/prisma";

export const autoEmailEnabledSettingKey = "auto_email_enabled";
export const autoEmailScheduleEnabledSettingKey = "auto_email_schedule_enabled";
export const autoEmailScheduleStartSettingKey = "auto_email_schedule_start";
export const autoEmailScheduleEndSettingKey = "auto_email_schedule_end";
export const autoEmailDailyLimitSettingKey = "auto_email_daily_limit";
export const maxArticleCrawlLimitSettingKey = "max_article_crawl_limit";
export const maxLeadAnalysisLimitSettingKey = "max_lead_analysis_limit";
export const debugDisableActualEmailSendingSettingKey = "debug_disable_actual_email_sending";

const defaultScheduleStart = "20:00";
const defaultScheduleEnd = "00:00";
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
  autoEmailScheduleEnabled: boolean;
  autoEmailScheduleStart: string;
  autoEmailScheduleEnd: string;
  autoEmailDailyLimit: number;
  maxArticleCrawlLimit: number;
  maxLeadAnalysisLimit: number;
};

export type DebugSettings = {
  disableActualEmailSending: boolean;
};

export async function getOperationsSettings(): Promise<OperationsSettings> {
  const settings = await prisma.appSetting.findMany({
    where: {
      key: {
        in: [
          autoEmailEnabledSettingKey,
          autoEmailScheduleEnabledSettingKey,
          autoEmailScheduleStartSettingKey,
          autoEmailScheduleEndSettingKey,
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
    autoEmailScheduleEnabled: values.get(autoEmailScheduleEnabledSettingKey) === "true",
    autoEmailScheduleStart: normalizeTimeValue(values.get(autoEmailScheduleStartSettingKey), defaultScheduleStart),
    autoEmailScheduleEnd: normalizeTimeValue(values.get(autoEmailScheduleEndSettingKey), defaultScheduleEnd),
    autoEmailDailyLimit: normalizeDailyLimit(values.get(autoEmailDailyLimitSettingKey)),
    maxArticleCrawlLimit: normalizeArticleCrawlLimit(values.get(maxArticleCrawlLimitSettingKey)),
    maxLeadAnalysisLimit: normalizeLeadAnalysisLimit(values.get(maxLeadAnalysisLimitSettingKey))
  };
}

export async function getDebugSettings(): Promise<DebugSettings> {
  const setting = await prisma.appSetting.findUnique({ where: { key: debugDisableActualEmailSendingSettingKey } });
  return { disableActualEmailSending: setting?.value === "true" };
}

export async function saveDebugSettings(input: DebugSettings) {
  await prisma.appSetting.upsert({
    where: { key: debugDisableActualEmailSendingSettingKey },
    create: { key: debugDisableActualEmailSendingSettingKey, value: input.disableActualEmailSending ? "true" : "false" },
    update: { value: input.disableActualEmailSending ? "true" : "false" }
  });
  return input;
}

export async function saveOperationsSettings(input: OperationsSettings) {
  const autoEmailDailyLimit = normalizeDailyLimit(String(input.autoEmailDailyLimit));
  const autoEmailScheduleStart = normalizeTimeValue(input.autoEmailScheduleStart, defaultScheduleStart);
  const autoEmailScheduleEnd = normalizeTimeValue(input.autoEmailScheduleEnd, defaultScheduleEnd);
  const maxArticleCrawlLimit = normalizeArticleCrawlLimit(String(input.maxArticleCrawlLimit));
  const maxLeadAnalysisLimit = normalizeLeadAnalysisLimit(String(input.maxLeadAnalysisLimit));
  await prisma.$transaction([
    prisma.appSetting.upsert({
      where: { key: autoEmailEnabledSettingKey },
      create: { key: autoEmailEnabledSettingKey, value: input.autoEmailEnabled ? "true" : "false" },
      update: { value: input.autoEmailEnabled ? "true" : "false" }
    }),
    prisma.appSetting.upsert({
      where: { key: autoEmailScheduleEnabledSettingKey },
      create: { key: autoEmailScheduleEnabledSettingKey, value: input.autoEmailScheduleEnabled ? "true" : "false" },
      update: { value: input.autoEmailScheduleEnabled ? "true" : "false" }
    }),
    prisma.appSetting.upsert({
      where: { key: autoEmailScheduleStartSettingKey },
      create: { key: autoEmailScheduleStartSettingKey, value: autoEmailScheduleStart },
      update: { value: autoEmailScheduleStart }
    }),
    prisma.appSetting.upsert({
      where: { key: autoEmailScheduleEndSettingKey },
      create: { key: autoEmailScheduleEndSettingKey, value: autoEmailScheduleEnd },
      update: { value: autoEmailScheduleEnd }
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

  return {
    autoEmailEnabled: input.autoEmailEnabled,
    autoEmailScheduleEnabled: input.autoEmailScheduleEnabled,
    autoEmailScheduleStart,
    autoEmailScheduleEnd,
    autoEmailDailyLimit,
    maxArticleCrawlLimit,
    maxLeadAnalysisLimit
  };
}

export async function setAutoEmailEnabled(enabled: boolean) {
  await prisma.appSetting.upsert({
    where: { key: autoEmailEnabledSettingKey },
    create: { key: autoEmailEnabledSettingKey, value: enabled ? "true" : "false" },
    update: { value: enabled ? "true" : "false" }
  });
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

export function normalizeTimeValue(value: string | null | undefined, fallback: string) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return fallback;
  const [hour, minute] = value.split(":").map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function isWithinAutoEmailSchedule(settings: OperationsSettings, now = new Date()) {
  if (!settings.autoEmailScheduleEnabled) return true;
  const start = timeToMinutes(settings.autoEmailScheduleStart);
  const end = timeToMinutes(settings.autoEmailScheduleEnd);
  const current = now.getHours() * 60 + now.getMinutes();
  if (start === end) return true;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}
