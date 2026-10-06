import type { SubscriptionPlan } from "../../api/subscription";
import "./billing.css";

export function PlanCard({
  plan,
  isSelected,
  isCurrent,
  disabled,
  onSelect,
}: {
  plan: SubscriptionPlan;
  isSelected: boolean;
  isCurrent: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`bl-plan-card ${isSelected ? "bl-plan-card--selected" : ""}`}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isSelected}
    >
      <div className="bl-plan-card__top">
        <span className="bl-plan-card__name">{plan}</span>
        {isCurrent && <span className="bl-plan-card__badge">Current</span>}
      </div>
      <span className="bl-plan-card__period">{plan === "FREE" ? "12 month license" : "1 month license"}</span>
      {isSelected && <span className="bl-plan-card__check">✓ Selected</span>}
    </button>
  );
}
