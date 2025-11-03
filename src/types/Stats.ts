// Evento: Conteo por día
export interface EventCountByDay {
  date: string;
  count: number;
}

export interface EventCountByDayResponse {
  stats: EventCountByDay[];
}
export interface TopModel {
  model: string;
  total: string;
  percent: number;
}

export interface TopPartType {
  part_type: string;
  total: string;
  percent: number;
}

export interface Stats {
  totalEvents: number;
  topModels: TopModel[];
  topPartTypes: TopPartType[];
}

export interface StatsResponse {
  stats: Stats;
}
