import { crawlActiveSources } from "../src/lib/crawler";

crawlActiveSources()
  .then((result) => {
    console.log(`[OK] Crawl complete - found: ${result.articlesFound}, saved: ${result.articlesSaved}`);
    if (result.errors.length) console.log(result.errors.join("\n"));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
