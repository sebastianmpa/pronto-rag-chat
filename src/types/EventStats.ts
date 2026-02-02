export interface EventStat {
  event: string;
  total: string;
  event_friendly_name?: string;
}

export interface EventStatsResponse {
  stats: EventStat[];
}

// Response for total events per user
export interface TotalEventsPerUserStat {
  client_firstname: string;
  client_lastname: string;
  client_email: string;
  total: string;
}

export interface TotalEventsPerUserResponse {
  stats: TotalEventsPerUserStat[];
}
