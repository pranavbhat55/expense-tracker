import { Badge } from "../common/primitives";
import { GrowBar } from "../common/GrowBar";
import type { Entitlements } from "../../api/subscription";
import "./billing.css";

export function UsageSummary({ entitlements, usage, quota }: { entitlements: Entitlements; usage: number; quota: number | null }) {
  const pct = quota ? Math.min(100, (usage / quota) * 100) : 0;

  return (
    <div className="bl-usage">
      <div className="bl-usage__row">
        <span>Monthly expenses</span>
        <span>
          {usage} {quota === null ? "/ unlimited" : `/ ${quota}`}
        </span>
      </div>
      {quota !== null && (
        <div className="db-category-row__track">
          <GrowBar className="db-category-row__fill" pct={pct} />
        </div>
      )}
      <div className="bl-usage__badges">
        <Badge tone={entitlements.features.budgets ? "success" : "neutral"}>
          {entitlements.features.budgets ? "Budgets" : "No budgets"}
        </Badge>
        <Badge tone={entitlements.features.timelineReports ? "success" : "neutral"}>
          {entitlements.features.timelineReports ? "Timeline reports" : "No timeline reports"}
        </Badge>
        <Badge tone={entitlements.features.csvExport ? "success" : "neutral"}>
          {entitlements.features.csvExport ? "CSV export" : "No CSV export"}
        </Badge>
      </div>
    </div>
  );
}
