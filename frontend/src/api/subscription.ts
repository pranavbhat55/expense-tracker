export type SubscriptionPlan = "FREE" | "PRO" | "BUSINESS";
export type SubscriptionStatus = "ACTIVE" | "TRIALING" | "EXPIRED" | "CANCELLED";
export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

export interface Entitlements {
  features: { timelineReports: boolean; csvExport: boolean; budgets: boolean };
  limits: { maxUsers: number | null; maxExpensesPerMonth: number | null };
  usage?: { expensesThisMonth: number; users?: number };
}

export interface Subscription {
  id: number;
  tenantId: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  licenseKey?: string;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  role?: WorkspaceRole;
  isSuperAdmin?: boolean;
  entitlements?: Entitlements;
}

const API_URL = "http://localhost:3000";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function subscriptionRequest(url: string, options: RequestInit = {}): Promise<Subscription> {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}`, ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, typeof data.message === "string" ? data.message : "Subscription request failed", data.code);
  }
  if (data.subscription) {
    return {
      ...data.subscription,
      role: data.role,
      isSuperAdmin: data.isSuperAdmin,
      entitlements: data.entitlements,
    };
  }

  return data;
}

/** Uses the entitlement endpoint when available, while retaining compatibility with the original API. */
export async function getSubscription(): Promise<Subscription> {
  try {
    return await subscriptionRequest("/subscriptions/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return subscriptionRequest("/subscription");
    throw error;
  }
}

export async function createSubscription(plan: SubscriptionPlan): Promise<Subscription> {
  return subscriptionRequest("/subscription", { method: "POST", body: JSON.stringify({ plan }) });
}

export async function changeSubscription(plan: SubscriptionPlan): Promise<Subscription> {
  try {
    return await subscriptionRequest("/subscriptions/change-plan", { method: "POST", body: JSON.stringify({ plan }) });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return subscriptionRequest("/subscription", { method: "PUT", body: JSON.stringify({ plan }) });
    }
    throw error;
  }
}
