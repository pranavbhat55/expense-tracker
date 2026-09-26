import { Badge, Card, EmptyState, LoadingState } from "../common/primitives";
import type { WorkspaceMember, WorkspaceRole } from "../../api/workspace";
import "./workspace.css";

const ROLE_TONE: Record<WorkspaceRole, "brand" | "neutral" | "success"> = {
  OWNER: "brand",
  ADMIN: "success",
  MEMBER: "neutral",
};

export function MembersSection({
  members,
  loading,
  error,
  canManage,
  onRoleChange,
  onRemove,
}: {
  members: WorkspaceMember[];
  loading: boolean;
  error: string;
  canManage: boolean;
  onRoleChange: (member: WorkspaceMember, role: WorkspaceRole) => void;
  onRemove: (member: WorkspaceMember) => void;
}) {
  return (
    <Card className="ws-card" padded={false}>
      <div className="ws-card__header">
        <div>
          <h2>Workspace members</h2>
          <p>People with access to this organization.</p>
        </div>
      </div>

      {error && <p className="error ws-error">{error}</p>}

      {loading ? (
        <LoadingState label="Loading members…" />
      ) : members.length === 0 ? (
        <EmptyState title="No members yet" />
      ) : (
        <div className="ws-table" role="table" aria-label="Workspace members">
          <div className="ws-row ws-row--head" role="row">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Joined</span>
            <span className="ws-actions-head">Actions</span>
          </div>
          {members.map((member) => (
            <div className="ws-row" role="row" key={member.id}>
              <span className="ws-name">{member.name}</span>
              <span className="ws-email">{member.email}</span>
              <span>
                {canManage ? (
                  <select
                    aria-label={`Role for ${member.name}`}
                    value={member.role}
                    onChange={(e) => onRoleChange(member, e.target.value as WorkspaceRole)}
                  >
                    <option value="OWNER">OWNER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MEMBER">MEMBER</option>
                  </select>
                ) : (
                  <Badge tone={ROLE_TONE[member.role]}>{member.role}</Badge>
                )}
              </span>
              <span className="ws-date">{new Date(member.createdAt).toLocaleDateString()}</span>
              <span className="ws-actions">
                {canManage ? (
                  <button className="ws-remove" type="button" onClick={() => onRemove(member)}>
                    Remove
                  </button>
                ) : (
                  "—"
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
