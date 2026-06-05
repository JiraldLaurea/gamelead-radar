"use client";

import { FileSearch, Radar } from "lucide-react";
import { LoadingForm } from "./loading-form";

export function DashboardActionForm({
  action,
  kind
}: {
  action: string;
  kind: "crawl" | "analyze";
}) {
  const isCrawl = kind === "crawl";
  const Icon = isCrawl ? Radar : FileSearch;
  const label = isCrawl ? "Crawling" : "Analyzing pending articles";

  return (
    <LoadingForm action={action} loadingLabel={label}>
      <button className={isCrawl ? "button" : "button secondary"} type="submit">
        <Icon size={16} /> {isCrawl ? "Run Crawl" : "Analyze Pending Articles"}
      </button>
    </LoadingForm>
  );
}
