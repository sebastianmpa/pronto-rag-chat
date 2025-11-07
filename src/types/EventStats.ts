export interface EventStat {
  event: string;
  total: string;
  event_friendly_name?: string;
}

export interface EventStatsResponse {
  stats: EventStat[];
}
