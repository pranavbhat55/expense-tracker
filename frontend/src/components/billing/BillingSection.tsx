import { Badge, Button, Card } from "../common/primitives";
import { PlanCard } from "./PlanCard";
import { UsageSummary } from "./UsageSummary";
import type { Subscription, SubscriptionPlan } from "../../api/subscription";
import "./billing.css";

const PLANS: SubscriptionPlan[] = ["FREE", "PRO", "BUSINESS"];

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success",
  TRIALING: "warning",
  EXPIRED: "danger",
  CANCELLED: "neutral",
};

export function BillingSection({
  subscription,
  error,
  usage,
  quota,
  selectedPlan,
  canManageSubscription,
  subscriptionLoading,
  onSelectPlan,
  onChangePlan,
}: {
  subscription: Subscription | null;
  error: string;
  usage: number;
  quota: number | null;
  selectedPlan: SubscriptionPlan;
  canManageSubscription: boolean;
  subscriptionLoading: boolean;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  onChangePlan: () => void;
}) {
  const isCurrentSelection = subscription?.plan === selectedPlan && subscription.status === "ACTIVE";

  return (
    <div className="bl-view">
      <Card className="bl-header-card">
        <div className="bl-header">
          <div>
            <span className="bl-eyebrow">Account plan</span>
            <h2>Subscription &amp; licensing</h2>
            <p>Manage your organization's plan and license.</p>
          </div>
          {subscription && <Badge tone={STATUS_TONE[subscription.status] ?? "neutral"}>{subscription.status}</Badge>}
        </div>

        {error && <p className="error">{error}</p>}

        <div className="bl-current">
          <div>
            <span className="bl-label">Current plan</span>
            <strong>{subscription ? subscription.plan : "No active plan"}</strong>
          </div>
          {subscription && (
            <div>
              <span className="bl-label">License expires</span>
              <strong>{new Date(subscription.expiresAt).toLocaleDateString()}</strong>
            </div>
          )}
        </div>

        {subscription?.entitlements && (
          <UsageSummary entitlements={subscription.entitlements} usage={usage} quota={quota} />
        )}
      </Card>

      <Card>
        <div className="db-card-header">
          <h3>Choose a plan</h3>
          <p>
            {canManageSubscription
              ? "Change the plan for this organization. This is a demo plan-management flow; no payment is processed."
              : "Only the workspace owner can change or cancel this subscription."}
          </p>
        </div>

        <div className="bl-plan-grid">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan}
              plan={plan}
              isSelected={selectedPlan === plan}
              isCurrent={subscription?.plan === plan}
              disabled={!canManageSubscription}
              onSelect={() => onSelectPlan(plan)}
            />
          ))}
        </div>

        <div className="bl-action-row">
          <Button
            onClick={onChangePlan}
            disabled={!canManageSubscription || subscriptionLoading || isCurrentSelection}
          >
            {subscriptionLoading
              ? "Updating…"
              : isCurrentSelection
                ? "Current plan"
                : !canManageSubscription
                  ? "Owner access required"
                  : subscription
                    ? `${selectedPlan === "FREE" ? "Downgrade" : "Change plan"} to ${selectedPlan}`
                    : `Activate ${selectedPlan}`}
          </Button>
        </div>
      </Card>

      {subscription && canManageSubscription && (
        <Card className="bl-license-card">
          <div className="bl-license-heading">
            <div>
              <span className="bl-label">License information</span>
              <h3>Organization license</h3>
            </div>
            <Badge tone="brand">Licensed</Badge>
          </div>

          <div className="bl-license-key">
            <span>License key</span>
            <code>{subscription.licenseKey}</code>
          </div>

          <div className="bl-license-meta">
            <div>
              <span>Plan</span>
              <strong>{subscription.plan}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{subscription.status}</strong>
            </div>
            <div>
              <span>Start date</span>
              <strong>{new Date(subscription.startsAt).toLocaleDateString()}</strong>
            </div>
            <div>
              <span>Expiry date</span>
              <strong>{new Date(subscription.expiresAt).toLocaleDateString()}</strong>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
