import { Shell } from "@/components/shell";
import { ArticleReviewTable } from "@/components/article-review-table";
import { prisma } from "@/lib/prisma";

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({ include: { source: true, opportunity: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <Shell title="Article Review" subtitle="Collected raw articles, processing state, and lead conversion.">
      <ArticleReviewTable
        articles={articles.map((article) => ({
          id: article.id,
          title: article.title,
          source: article.source.name,
          published: article.publishedAt?.toLocaleDateString() ?? "Unknown",
          processed: article.processed ? "Yes" : "No",
          result: article.opportunity ? "Lead" : article.excluded ? "Excluded" : "Pending",
          url: article.url
        }))}
      />
    </Shell>
  );
}
