const API_URL = "http://localhost:3000";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";
export interface WorkspaceMember { id: number; name: string; email: string; role: WorkspaceRole; createdAt: string; }
export interface AuditLog { id: number; action: string; entityType: string; entityId: string; metadata: Record<string, unknown> | null; createdAt: string; user: { id: number; name: string; email: string } | null; }
export interface AuditLogsResponse { data: AuditLog[]; pagination: { page: number; limit: number; total: number; totalPages: number }; }

async function workspaceRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}`, ...options.headers } });
  if (response.status === 204) return undefined;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "Workspace request failed");
  return data;
}

export async function getMembers(): Promise<WorkspaceMember[]> { return workspaceRequest("/workspace/members") as Promise<WorkspaceMember[]>; }
export async function changeMemberRole(id: number, role: WorkspaceRole): Promise<WorkspaceMember> { return workspaceRequest(`/workspace/members/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }) as Promise<WorkspaceMember>; }
export async function removeMember(id: number): Promise<void> { await workspaceRequest(`/workspace/members/${id}`, { method: "DELETE" }); }
export async function getAuditLogs(page = 1): Promise<AuditLogsResponse> { return workspaceRequest(`/workspace/audit-logs?page=${page}&limit=20`) as Promise<AuditLogsResponse>; }

export interface WorkspaceInvitation { id: number; email: string; role: WorkspaceRole; expiresAt: string; createdAt: string; }
export interface WorkspaceSettings { name: string; slug: string; inviteOnly: boolean; seats: { used: number; limit: number | null; pendingInvites: number }; }
export async function getWorkspaceSettings(): Promise<WorkspaceSettings> { return workspaceRequest("/workspace/settings") as Promise<WorkspaceSettings>; }
export async function updateWorkspaceSettings(inviteOnly: boolean): Promise<WorkspaceSettings> { return workspaceRequest("/workspace/settings", { method: "PATCH", body: JSON.stringify({ inviteOnly }) }) as Promise<WorkspaceSettings>; }
export async function listInvitations(): Promise<WorkspaceInvitation[]> { return workspaceRequest("/workspace/invitations") as Promise<WorkspaceInvitation[]>; }
export async function createInvitation(email: string, role: "ADMIN" | "MEMBER"): Promise<WorkspaceInvitation & { token: string }> { return workspaceRequest("/workspace/invitations", { method: "POST", body: JSON.stringify({ email, role }) }) as Promise<WorkspaceInvitation & { token: string }>; }
export async function revokeInvitation(id: number): Promise<void> { await workspaceRequest(`/workspace/invitations/${id}`, { method: "DELETE" }); }
