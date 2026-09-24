import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, EmptyState } from "../common/primitives";
import type { ExpenseSummary } from "../../types/expense";
import "./dashboard.css";

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

export function SpendingChart({ summary }: { summary: ExpenseSummary | null }) {
  const hasData = summary && summary.byCategory.length > 0;

  return (
    <Card className="db-chart-card">
      <div className="db-card-header">
        <h3>Spending by category</h3>
        <p>Breakdown for the selected period</p>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={summary.byCategory} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="dbCategoryBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand-500)" />
                <stop offset="100%" stopColor="var(--brand-700)" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5" />
            <XAxis dataKey="category" axisLine={false} tickLine={false} tick={axisStyle} interval={0} />
            <YAxis axisLine={false} tickLine={false} tick={axisStyle} tickFormatter={formatCompactCurrency} width={56} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={(label) => `Category: ${label}`}
              cursor={{ fill: "var(--brand-50)" }}
              contentStyle={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "var(--surface)",
                boxShadow: "var(--shadow-md)",
              }}
            />
            <Bar dataKey="total" name="Spending" fill="url(#dbCategoryBar)" barSize={32} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState title="No spending data" description="There's no spending recorded for this period yet." />
      )}
    </Card>
  );
}
