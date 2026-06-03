import sourceSeed from "../seed/sources.json";

type RawSource = {
  id?: string;
  name: string;
  region: string;
  language?: string;
  source_type?: string;
  sourceType?: string;
  url: string;
  priority?: number;
  reliability?: string;
  active?: boolean;
  requires_verification?: boolean;
  requiresVerification?: boolean;
  crawl_frequency_hours?: number;
  crawlFrequencyHours?: number;
  max_items_per_run?: number;
  maxItemsPerRun?: number;
  parser?: unknown;
  filters?: unknown;
  notes?: string;
};

export function getSeedSources() {
  const rawSources = Array.isArray(sourceSeed) ? sourceSeed : sourceSeed.sources;
  return (rawSources as RawSource[]).map((source) => ({
    name: source.name,
    region: source.region,
    language: source.language ?? "en",
    sourceType: source.sourceType ?? source.source_type ?? "rss",
    url: source.url,
    active: source.active ?? false,
    requiresVerification: source.requiresVerification ?? source.requires_verification ?? true,
    crawlFrequencyHours: source.crawlFrequencyHours ?? source.crawl_frequency_hours ?? 12,
    maxItemsPerRun: source.maxItemsPerRun ?? source.max_items_per_run ?? 30,
    priority: source.priority ?? 3,
    reliability: source.reliability ?? "medium",
    parserConfig: source.parser ? JSON.stringify(source.parser) : null,
    filterConfig: source.filters ? JSON.stringify(source.filters) : null,
    notes: source.notes ?? null
  }));
}
