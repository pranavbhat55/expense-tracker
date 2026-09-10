import type { TimelineReport } from "../types/report";

const API_URL = "http://localhost:3000";

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
    throw new Error("Failed to fetch timeline report");
  }

  return response.json();
}
