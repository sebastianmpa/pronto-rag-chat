export interface FoundStats {
  found: number;
  notFound: number;
  foundPercent: number;
  notFoundPercent: number;
}

export interface FoundStatsResponse {
  stats: FoundStats;
}
