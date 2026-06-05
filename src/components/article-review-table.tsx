"use client";

type ArticleReviewRow = {
  id: string;
  title: string;
  source: string;
  published: string;
  processed: string;
  result: string;
  url: string;
};

export function ArticleReviewTable({ articles }: { articles: ArticleReviewRow[] }) {
  return (
    <div className="table-wrap article-review-table-shell">
      <div className="table-scroll article-review-table-wrap">
        <table className="article-review-table">
        <thead>
          <tr>
            <th className="article-title-column">Title</th>
            <th className="article-source-column">Source</th>
            <th className="article-published-column">Published</th>
            <th className="article-processed-column">Processed</th>
            <th className="article-result-column">Result</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr
              className="clickable-row"
              key={article.id}
              onClick={() => window.open(article.url, "_blank", "noopener,noreferrer")}
            >
              <td>{article.title}</td>
              <td>{article.source}</td>
              <td>{article.published}</td>
              <td>{article.processed}</td>
              <td>{article.result}</td>
            </tr>
          ))}
          {articles.length === 0 ? (
            <tr>
              <td colSpan={5}>No articles collected yet.</td>
            </tr>
          ) : null}
        </tbody>
        </table>
      </div>
    </div>
  );
}
