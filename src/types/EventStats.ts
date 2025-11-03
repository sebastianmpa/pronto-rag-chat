export interface EventStat {
  event: string;
  total: string;
}

export interface EventStatsResponse {
  stats: EventStat[];
}
