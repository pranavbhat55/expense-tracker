export interface TimelinePoint {
  date: string;
  total: number;
  count: number;
}

export interface TimelineReport {
  from: string;
  to: string;
  groupBy: "day" | "week" | "month";
  total: number;
  count: number;
  timeline: TimelinePoint[];
}
