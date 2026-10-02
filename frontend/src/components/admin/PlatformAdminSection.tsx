import { useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, LoadingState } from "../common/primitives";
import { getAllTenants, setTenantSubscriptionStatus, type AdminTenantSummary } from "../../api/admin";
import "./admin.css";

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success",
  TRIALING: "warning",
  EXPIRED: "danger",
  CANCELLED: "neutral",
};

export function PlatformAdminSection() {
  const [tenants, setTenants] = useState<AdminTenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setTenants(await getAllTenants());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(tenant: AdminTenantSummary) {
    if (!tenant.subscription) return;
    const nextStatus = tenant.subscription.status === "CANCELLED" ? "ACTIVE" : "CANCELLED";
    setActioningId(tenant.id);
    try {
      await setTenantSubscriptionStatus(tenant.id, nextStatus);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tenant");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <Card padded={false}>
      <div className="ad-header">
        <div>
          <h2>Platform admin</h2>
          <p>Cross-tenant view, visible only to platform super-admins.</p>
        </div>
      </div>

      {error && <p className="error ad-error">{error}</p>}

      {loading ? (
        <LoadingState label="Loading tenants…" />
      ) : tenants.length === 0 ? (
        <EmptyState title="No tenants found" />
      ) : (
        <div className="ad-table">
          <div className="ad-row ad-row--head">
            <span>Tenant</span>
            <span>Plan</span>
            <span>Status</span>
            <span>Members</span>
            <span>Expenses</span>
            <span className="ad-actions-head">Actions</span>
          </div>
          {tenants.map((tenant) => (
            <div className="ad-row" key={tenant.id}>
              <span className="ad-tenant">
                <strong>{tenant.name}</strong>
                <small>{tenant.slug}</small>
              </span>
              <span>{tenant.subscription?.plan ?? "—"}</span>
              <span>
                {tenant.subscription ? (
                  <Badge tone={STATUS_TONE[tenant.subscription.status] ?? "neutral"}>{tenant.subscription.status}</Badge>
                ) : (
                  "—"
                )}
              </span>
              <span>{tenant.memberCount}</span>
              <span>{tenant.expenseCount}</span>
              <span className="ad-actions">
                {tenant.subscription && (
                  <Button
                    variant={tenant.subscription.status === "CANCELLED" ? "secondary" : "danger"}
                    disabled={actioningId === tenant.id}
                    onClick={() => toggleStatus(tenant)}
                  >
                    {actioningId === tenant.id ? "Working…" : tenant.subscription.status === "CANCELLED" ? "Reactivate" : "Suspend"}
                  </Button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
