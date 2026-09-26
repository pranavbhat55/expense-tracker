import type { AuditLog } from "../../api/workspace";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function describeAuditLog(log: AuditLog): string {
  const metadata = log.metadata ?? {};
  const actor = log.user?.name ?? "A workspace member";
  switch (log.action) {
    case "MEMBER_JOINED":
      return `${actor} joined the workspace`;
    case "ROLE_CHANGED":
      return `${actor} changed a member role: ${String(metadata.previousRole ?? "")} → ${String(metadata.newRole ?? "")}`;
    case "MEMBER_REMOVED":
      return `${actor} removed ${String(metadata.memberEmail ?? "a member")}`;
    case "EXPENSE_CREATED":
      return `${actor} created an expense: ${formatCurrency(Number(metadata.amount ?? 0))} · ${String(metadata.category ?? "")}`;
    case "EXPENSE_UPDATED":
      return `${actor} updated an expense: ${formatCurrency(Number(metadata.amount ?? 0))} · ${String(metadata.category ?? "")}`;
    case "EXPENSE_DELETED":
      return `${actor} deleted an expense: ${formatCurrency(Number(metadata.amount ?? 0))} · ${String(metadata.category ?? "")}`;
    case "BUDGET_CREATED":
      return `${actor} created a budget for ${String(metadata.category ?? "")}`;
    case "BUDGET_UPDATED":
      return `${actor} updated a budget for ${String(metadata.category ?? "")}`;
    case "BUDGET_DELETED":
      return `${actor} deleted a budget for ${String(metadata.category ?? "")}`;
    case "SUBSCRIPTION_PLAN_CHANGED":
      return `${actor} changed the subscription: ${String(metadata.previousPlan ?? "")} → ${String(metadata.newPlan ?? "")}`;
    default:
      return `${actor} performed ${log.action.toLowerCase().replaceAll("_", " ")}`;
  }
}
