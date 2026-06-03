import type { Opportunity, Company, Game } from "@prisma/client";

type OpportunityContext = Opportunity & { company: Company; game: Game };

export function buildEmailDraft(opportunity: OpportunityContext) {
  const packages = JSON.parse(opportunity.recommendedPackages) as string[];
  const topPackages = packages.slice(0, 3);

  return {
    subject: `Support for ${opportunity.game.title}'s upcoming ${opportunity.opportunityType}`,
    body: `Hi ${opportunity.company.name} Team,

I saw the recent news about ${opportunity.company.name} preparing ${opportunity.game.title} for ${opportunity.opportunityType.replaceAll("_", " ")}.

Based on this stage, teams often need support with ${topPackages.join(", ")}.

QROAD supports game companies with:
${topPackages.map((item) => `- ${item}`).join("\n")}

Would it be possible to briefly discuss whether external support could help your upcoming schedule?

Best regards,
QROAD Team`
  };
}

export function buildLinkedInDraft(opportunity: OpportunityContext) {
  return {
    body: `Hi ${opportunity.company.name} Team,

I saw the news about ${opportunity.company.name}'s upcoming ${opportunity.game.title} ${opportunity.opportunityType.replaceAll("_", " ")}.

QROAD supports game companies with QA, localization QA, launch operations, community management, and marketing/creative support.

If your team is preparing for launch, I would be glad to share how we can support the schedule.

Best regards,
QROAD Team`
  };
}
