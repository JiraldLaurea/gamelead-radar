import { crawlActiveSources } from "@/lib/crawler";
import { contentHash } from "@/lib/analysis";
import { emailSubjectTemplate } from "@/lib/email-template-defaults";
import { getEmailBodyTemplate } from "@/lib/email-template";
import { emailForOpportunityWithTemplate } from "@/lib/mailer";
import { runAutomaticEmailPass } from "@/lib/auto-email";
import { analyzePendingArticles } from "@/lib/lead-analysis-runner";
import { getOperationsSettings } from "@/lib/operations-settings";
import { prisma } from "@/lib/prisma";

type AutomationPhase = "idle" | "crawling" | "analyzing" | "sending" | "done" | "blocked" | "disabled" | "error";

export type AutomationStatus = {
  running: boolean;
  phase: AutomationPhase;
  message: string;
  startedAt: string | null;
  updatedAt: string | null;
  iteration: number;
  sentToday: number;
  target: number;
  crawled: number;
  analyzed: number;
  analysisFailed: number;
  emailsSent: number;
  emailFailed: number;
};

type AutomationState = {
  status: AutomationStatus;
  promise: Promise<void> | null;
  cancelRequested: boolean;
};

const initialStatus: AutomationStatus = {
  running: false,
  phase: "idle",
  message: "Automation is idle.",
  startedAt: null,
  updatedAt: null,
  iteration: 0,
  sentToday: 0,
  target: 0,
  crawled: 0,
  analyzed: 0,
  analysisFailed: 0,
  emailsSent: 0,
  emailFailed: 0
};

const globalForAutomation = globalThis as typeof globalThis & {
  gameLeadAutomationState?: AutomationState;
};

function getState() {
  if (!globalForAutomation.gameLeadAutomationState) {
    globalForAutomation.gameLeadAutomationState = { status: initialStatus, promise: null, cancelRequested: false };
  }
  return globalForAutomation.gameLeadAutomationState;
}

export async function getAutomationStatus() {
  const state = getState();
  const settings = await getOperationsSettings();
  const sentToday = await countEmailsSentToday();
  const isTestRun = state.status.message.toLowerCase().includes("test automation") || state.status.message.toLowerCase().includes("test automatic");
  state.status = {
    ...state.status,
    sentToday,
    target: isTestRun ? state.status.target : settings.autoEmailDailyLimit,
    updatedAt: new Date().toISOString()
  };
  return state.status;
}

export async function ensureAutomationRunning(reason = "settings") {
  const state = getState();
  if (state.promise) return state.status;
  if (reason === "status check" && isTestAutomationStatus(state.status) && ["done", "blocked", "error"].includes(state.status.phase)) {
    return state.status;
  }
  if (reason === "status check" && ["blocked", "error"].includes(state.status.phase)) {
    return state.status;
  }

  const settings = await getOperationsSettings();
  const sentToday = await countEmailsSentToday();
  if (!settings.autoEmailEnabled) {
    updateStatus({ running: false, phase: "disabled", message: "Automatic email sending is disabled.", sentToday, target: settings.autoEmailDailyLimit });
    return state.status;
  }
  if (sentToday >= settings.autoEmailDailyLimit) {
    updateStatus({ running: false, phase: "done", message: "Daily email sending target reached.", sentToday, target: settings.autoEmailDailyLimit });
    return state.status;
  }

  state.promise = runAutomationLoop(reason).finally(() => {
    state.promise = null;
    state.cancelRequested = false;
  });
  return state.status;
}

export async function ensureTestAutomationRunning() {
  const state = getState();
  if (state.promise) return state.status;

  state.promise = runTestAutomationLoop().finally(() => {
    state.promise = null;
    state.cancelRequested = false;
  });
  return state.status;
}

export async function requestAutomationCancel() {
  const state = getState();
  if (!state.promise || !state.status.running) return state.status;

  state.cancelRequested = true;
  updateStatus({
    message: "Canceling automation after the current step finishes."
  });
  return state.status;
}

export async function disableAutomationStatus() {
  const settings = await getOperationsSettings();
  updateStatus({
    running: false,
    phase: "disabled",
    message: "Automatic email sending is disabled.",
    sentToday: await countEmailsSentToday(),
    target: settings.autoEmailDailyLimit
  });
  return getState().status;
}

async function runAutomationLoop(reason: string) {
  const startedAt = new Date().toISOString();
  updateStatus({
    running: true,
    phase: "crawling",
    message: `Automation started from ${reason}.`,
    startedAt,
    iteration: 0,
    crawled: 0,
    analyzed: 0,
    analysisFailed: 0,
    emailsSent: 0,
    emailFailed: 0
  });

  let noProgressCycles = 0;
  for (let iteration = 1; iteration <= 120; iteration += 1) {
    if (stopIfCancelRequested()) return;
    const settings = await getOperationsSettings();
    let sentToday = await countEmailsSentToday();
    if (!settings.autoEmailEnabled) {
      updateStatus({ running: false, phase: "disabled", message: "Automation stopped because automatic email sending is disabled.", sentToday, target: settings.autoEmailDailyLimit });
      return;
    }
    if (sentToday >= settings.autoEmailDailyLimit) {
      updateStatus({ running: false, phase: "done", message: "Daily email sending target reached.", sentToday, target: settings.autoEmailDailyLimit });
      return;
    }

    const pendingBeforeCrawl = await countPendingArticles();
    let crawl = { articlesFound: 0, articlesSaved: 0 };
    if (pendingBeforeCrawl > 0) {
      updateStatus({
        phase: "analyzing",
        message: `Cycle ${iteration}: using ${pendingBeforeCrawl} pending article${pendingBeforeCrawl === 1 ? "" : "s"} before crawling again.`,
        iteration,
        sentToday,
        target: settings.autoEmailDailyLimit
      });
    } else {
      updateStatus({
        phase: "crawling",
        message: `Cycle ${iteration}: crawling articles.`,
        iteration,
        sentToday,
        target: settings.autoEmailDailyLimit
      });
      crawl = await crawlActiveSources({ maxArticles: settings.maxArticleCrawlLimit });
      if (stopIfCancelRequested()) return;
    }

    const pendingBeforeAnalysis = await countPendingArticles();
    updateStatus({
      phase: "analyzing",
      message: `Cycle ${iteration}: analyzing up to ${settings.maxLeadAnalysisLimit} pending article${settings.maxLeadAnalysisLimit === 1 ? "" : "s"}.`,
      crawled: getState().status.crawled + crawl.articlesFound
    });
    const analysis = await analyzePendingArticles(settings.maxLeadAnalysisLimit);
    if (stopIfCancelRequested()) return;

    updateStatus({
      phase: "sending",
      message: `Cycle ${iteration}: sending Grade A emails.`,
      analyzed: getState().status.analyzed + analysis.analyzed,
      analysisFailed: getState().status.analysisFailed + analysis.failed
    });
    const email = await runAutomaticEmailPass();
    if (stopIfCancelRequested()) return;
    const nextSentToday = await countEmailsSentToday();
    updateStatus({
      emailsSent: getState().status.emailsSent + email.sent,
      emailFailed: getState().status.emailFailed + email.failed,
      sentToday: nextSentToday
    });

    if (nextSentToday >= settings.autoEmailDailyLimit) {
      updateStatus({ running: false, phase: "done", message: "Daily email sending target reached.", sentToday: nextSentToday, target: settings.autoEmailDailyLimit });
      return;
    }

    const pendingAfterAnalysis = await countPendingArticles();
    const madeProgress =
      nextSentToday > sentToday ||
      crawl.articlesSaved > 0 ||
      analysis.analyzed > 0 ||
      pendingAfterAnalysis < pendingBeforeAnalysis ||
      email.sent > 0;
    noProgressCycles = madeProgress ? 0 : noProgressCycles + 1;
    if (noProgressCycles >= 2 || email.reason === "smtp_missing") {
      updateStatus({
        running: false,
        phase: "blocked",
        message: email.reason === "smtp_missing" ? "SMTP is not configured, so automatic sending cannot continue." : "No additional eligible Grade A email leads were found.",
        sentToday: nextSentToday,
        target: settings.autoEmailDailyLimit
      });
      return;
    }
  }

  updateStatus({ running: false, phase: "blocked", message: "Automation stopped after 120 cycles without reaching the daily target." });
}

async function runTestAutomationLoop() {
  const startedAt = new Date().toISOString();
  updateStatus({
    running: true,
    phase: "crawling",
    message: "Test automation: crawling one sample article.",
    startedAt,
    iteration: 1,
    sentToday: await countEmailsSentToday(),
    target: 1,
    crawled: 0,
    analyzed: 0,
    analysisFailed: 0,
    emailsSent: 0,
    emailFailed: 0
  });

  try {
    const article = await createSamplePendingArticle();
    if (stopIfCancelRequested()) return;
    updateStatus({
      phase: "analyzing",
      message: "Test automation: analyzing the sample article.",
      crawled: 1
    });
    const lead = await createSampleGradeALead(article.id);
    if (stopIfCancelRequested()) return;
    updateStatus({
      phase: "sending",
      message: "Test automation: recording the sample Grade A email.",
      analyzed: 1
    });

    const bodyTemplate = await getEmailBodyTemplate();
    const draft = emailForOpportunityWithTemplate(lead, { subjectTemplate: emailSubjectTemplate, bodyTemplate });
    const testSubject = `[TEST - not sent] ${draft.subject}`;
    const testBody = `TEST AUTOMATION DRY RUN - no real email was sent.\n\n${draft.body}`;
    if (draft.draftId) {
      await prisma.outreachMessage.update({
        where: { id: draft.draftId },
        data: { status: "sent", subject: testSubject, body: testBody }
      });
    } else {
      await prisma.outreachMessage.create({
        data: {
              opportunityId: lead.id,
              channel: "email",
              language: "en",
              subject: testSubject,
              body: testBody,
              status: "sent"
            }
          });
    }

    updateStatus({
      running: false,
      phase: "done",
      message: "Test automatic email sending completed without sending a real email.",
      sentToday: await countEmailsSentToday(),
      target: 1,
      emailsSent: 1
    });
  } catch (error) {
    await prisma.systemLog.create({
      data: {
        level: "warning",
        module: "email",
        message: `Test automatic email failed: ${error instanceof Error ? error.message : "Unknown error"}`
      }
    });
    updateStatus({
      running: false,
      phase: "error",
      message: `Test automatic email failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      target: 1,
      emailFailed: 1
    });
  }
}

async function createSamplePendingArticle() {
  const now = new Date();
  const suffix = now.getTime();
  const source = await prisma.source.upsert({
    where: { url: "https://example.com/gamelead-radar-test-automation-feed.xml" },
    create: {
      name: "Test Automation Sample Source",
      region: "japan",
      language: "en",
      sourceType: "rss",
      url: "https://example.com/gamelead-radar-test-automation-feed.xml",
      active: false,
      requiresVerification: false,
      verificationStatus: "ok",
      priority: 5,
      reliability: "low",
      notes: "Local source used for testing automatic email sending."
    },
    update: {}
  });
  const title = "Test Studio opens pre-registration for Neon Quest";
  const rawContent =
    "Test Studio announced pre-registration for Neon Quest, an upcoming PC, iOS, and Android RPG preparing for a global launch. Contact email: jiraldcalusay@gmail.com.";

  return prisma.article.create({
    data: {
      sourceId: source.id,
      title,
      url: `https://example.com/gamelead-radar/test-automation-article-${suffix}`,
      publishedAt: now,
      rawContent,
      summary: "Sample article for testing automatic email sending.",
      language: "en",
      processed: false,
      contentHash: contentHash(`${title}|${suffix}|${rawContent}`)
    }
  });
}

async function createSampleGradeALead(articleId: string) {
  const now = new Date();
  const [company, game] = await Promise.all([
    prisma.company.create({
      data: {
        name: "Test Studio",
        country: "Japan",
        companyType: "developer",
        website: "https://example.com/test-studio",
        websiteStatus: "found",
        contactEmail: "jiraldcalusay@gmail.com",
        enrichmentStatus: "completed",
        enrichmentConfidence: 100,
        enrichmentSources: JSON.stringify(["https://example.com/test-studio"]),
        lastEnrichedAt: now
      }
    }),
    prisma.game.create({
      data: {
        title: "Neon Quest",
        platform: "PC, iOS, Android",
        genre: "RPG",
        launchStage: "pre_registration",
        expectedLaunchDate: new Date("2026-08-28T00:00:00.000Z")
      }
    })
  ]);

  const opportunity = await prisma.opportunity.create({
    data: {
      articleId,
      companyId: company.id,
      gameId: game.id,
      targetRegion: "Japan",
      opportunityType: "pre_registration",
      score: 92,
      grade: "A",
      status: "new",
      recommendedPackages: JSON.stringify([
        "Pre-Launch QA Package",
        "Store & Platform QA Package",
        "Global Launch Localization Package"
      ]),
      reasoning: "Sample Grade A lead created by the automatic email sending test.",
      evidenceQuotes: JSON.stringify([
        "Test Studio announced pre-registration for Neon Quest.",
        "The sample article includes PC, iOS, Android, global launch, and contact email signals.",
        "The test lead is configured with jiraldcalusay@gmail.com for outreach validation."
      ]),
      uncertainty: "Local test automation data only.",
      nextAction: "Send a test outreach email to validate automatic email sending."
    },
    include: { company: true, game: true, outreachMessages: true }
  });
  await prisma.article.update({ where: { id: articleId }, data: { processed: true } });
  return opportunity;
}

function updateStatus(patch: Partial<AutomationStatus>) {
  const state = getState();
  state.status = {
    ...state.status,
    ...patch,
    updatedAt: new Date().toISOString()
  };
}

function isTestAutomationStatus(status: AutomationStatus) {
  const message = status.message.toLowerCase();
  return message.includes("test automation") || message.includes("test automatic");
}

function stopIfCancelRequested() {
  const state = getState();
  if (!state.cancelRequested) return false;

  updateStatus({
    running: false,
    phase: "blocked",
    message: "Automation canceled."
  });
  return true;
}

async function countEmailsSentToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prisma.outreachMessage.count({
    where: {
      channel: "email",
      status: "sent",
      updatedAt: { gte: today }
    }
  });
}

async function countPendingArticles() {
  return prisma.article.count({ where: { processed: false } });
}
