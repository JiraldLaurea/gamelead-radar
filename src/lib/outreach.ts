import type { Opportunity, Company, Game } from "@prisma/client";

type OpportunityContext = Opportunity & { company: Company; game: Game };

export function buildEmailDraft(opportunity: OpportunityContext) {
  const packages = JSON.parse(opportunity.recommendedPackages) as string[];
  const topPackages = packages.slice(0, 3);
  const hasCompanyName = hasIdentifiedCompanyName(opportunity.company.name);
  const greeting = hasCompanyName ? `Hi ${opportunity.company.name} Team,` : "Hi there,";
  const companyReference = hasCompanyName ? opportunity.company.name : "your team";

  return {
    subject: `Support for ${opportunity.game.title}'s upcoming ${opportunity.opportunityType}`,
    body: `${greeting}

I saw the recent news about ${companyReference} preparing ${opportunity.game.title} for ${opportunity.opportunityType.replaceAll("_", " ")}.

Based on this stage, teams often need support with ${topPackages.join(", ")}.

QROAD supports game companies with:
${topPackages.map((item) => `- ${item}`).join("\n")}

Would it be possible to briefly discuss whether external support could help your upcoming schedule?

Best regards,
QROAD Team`
  };
}

export function buildLinkedInDraft(opportunity: OpportunityContext) {
  const hasCompanyName = hasIdentifiedCompanyName(opportunity.company.name);
  const greeting = hasCompanyName ? `Hi ${opportunity.company.name} Team,` : "Hi there,";
  const companyReference = hasCompanyName ? `${opportunity.company.name}'s` : "your team's";

  return {
    body: `${greeting}

I saw the news about ${companyReference} upcoming ${opportunity.game.title} ${opportunity.opportunityType.replaceAll("_", " ")}.

QROAD supports game companies with QA, localization QA, launch operations, community management, and marketing/creative support.

If your team is preparing for launch, I would be glad to share how we can support the schedule.

Best regards,
QROAD Team`
  };
}

function hasIdentifiedCompanyName(name: string) {
  const normalized = name.trim().toLowerCase();
  return Boolean(normalized && normalized !== "needs research" && normalized !== "not identified" && normalized !== "unknown");
}
