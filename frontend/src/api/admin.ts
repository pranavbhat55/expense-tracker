const API_URL = "http://localhost:3000";

export interface AdminTenantSummary {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  memberCount: number;
  expenseCount: number;
  subscription: { plan: string; status: string; expiresAt: string } | null;
}

async function adminRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}`, ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.message === "string" ? data.message : "Admin request failed");
  }
  return data as T;
}

export function getAllTenants(): Promise<AdminTenantSummary[]> {
  return adminRequest("/admin/tenants");
}

export function setTenantSubscriptionStatus(tenantId: number, status: "ACTIVE" | "CANCELLED"): Promise<unknown> {
  return adminRequest(`/admin/tenants/${tenantId}/subscription-status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
