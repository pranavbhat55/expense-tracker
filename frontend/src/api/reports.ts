import type { TimelineReport } from "../types/report";

const API_URL = "http://localhost:3000";

export class TimelineApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "TimelineApiError";
    this.status = status;
  }
}

export async function getTimelineReport(
  from: string,
  to: string,
  groupBy: "day" | "week" | "month",
): Promise<TimelineReport> {
  const token = localStorage.getItem("token");

  const params = new URLSearchParams({
    from,
    to,
    groupBy,
  });

  const response = await fetch(
    `${API_URL}/reports/timeline?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new TimelineApiError(response.status, typeof data.message === "string" ? data.message : "Failed to fetch timeline report");
  }

  return response.json();
}
