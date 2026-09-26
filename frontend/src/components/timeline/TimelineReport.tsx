import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Button, Card, EmptyState } from "../common/primitives";
import type { TimelineReport as TimelineReportData } from "../../types/report";
import "./timeline.css";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
    style: "currency",
    currency: "INR",
  }).format(value);
}

const axisStyle = { fill: "var(--ink-500)", fontSize: 12, fontWeight: 600 };

type GroupBy = "day" | "week" | "month";

export function TimelineReportView({
  canUseTimeline,
  from,
  to,
  groupBy,
  loading,
  error,
  report,
  onFromChange,
  onToChange,
  onGroupByChange,
  onGenerate,
}: {
  canUseTimeline: boolean;
  from: string;
  to: string;
  groupBy: GroupBy;
  loading: boolean;
  error: string;
  report: TimelineReportData | null;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onGroupByChange: (v: GroupBy) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="tl-view">
      <Card className="tl-controls-card">
        <div className="db-card-header">
          <h3>Timeline report</h3>
          <p>Track spending over a date range, grouped by day, week, or month.</p>
        </div>

        {!canUseTimeline && (
          <div className="tl-lock">
            <Badge tone="warning">PRO feature</Badge>
            Timeline reports aren't included in your current plan. Upgrade to unlock this report.
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <div className="tl-controls">
          <div className="tl-field">
            <label htmlFor="timeline-from">From</label>
            <input id="timeline-from" type="date" value={from} disabled={!canUseTimeline} onChange={(e) => onFromChange(e.target.value)} />
          </div>
          <div className="tl-field">
            <label htmlFor="timeline-to">To</label>
            <input id="timeline-to" type="date" value={to} disabled={!canUseTimeline} onChange={(e) => onToChange(e.target.value)} />
          </div>
          <div className="tl-field">
            <label htmlFor="timeline-group">Group by</label>
            <select
              id="timeline-group"
              value={groupBy}
              disabled={!canUseTimeline}
              onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          <Button onClick={onGenerate} disabled={loading || !canUseTimeline}>
            {loading ? "Generating…" : "Generate report"}
          </Button>
        </div>
      </Card>

      {report && canUseTimeline && (
        <>
          <div className="db-stat-grid tl-stat-grid">
            <Card className="db-stat-card">
              <div className="db-stat-card__label">Total spent</div>
              <div className="db-stat-card__value">{formatCurrency(report.total)}</div>
              <div className="db-stat-card__sub">Selected date range</div>
            </Card>
            <Card className="db-stat-card">
              <div className="db-stat-card__label">Transactions</div>
              <div className="db-stat-card__value">{report.count}</div>
              <div className="db-stat-card__sub">expenses recorded</div>
            </Card>
          </div>

          <Card>
            <div className="db-card-header">
              <h3>Spending over time</h3>
            </div>
            {report.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={report.timeline} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="tlBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand-500)" />
                      <stop offset="100%" stopColor="var(--brand-700)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={axisStyle} minTickGap={28} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} tickFormatter={formatCompactCurrency} width={56} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(label) => `Period: ${label}`}
                    cursor={{ fill: "var(--brand-50)" }}
                    contentStyle={{
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      background: "var(--surface)",
                      boxShadow: "var(--shadow-md)",
                    }}
                  />
                  <Bar dataKey="total" name="Spending" fill="url(#tlBar)" barSize={28} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No expenses in this range" description="Try widening the date range or changing the grouping." />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
