import { useState } from "react";
import { Badge, Button, Card } from "../common/primitives";
import type { WorkspaceInvitation, WorkspaceSettings } from "../../api/workspace";
import "./workspace.css";

export function InvitePanel({
  settings, invitations, isOwner, error, onInvite, onRevoke, onToggleInviteOnly,
}: {
  settings: WorkspaceSettings | null;
  invitations: WorkspaceInvitation[];
  isOwner: boolean;
  error: string;
  onInvite: (email: string, role: "ADMIN" | "MEMBER") => Promise<string | null>;
  onRevoke: (id: number) => void;
  onToggleInviteOnly: (value: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [link, setLink] = useState<{ email: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const seats = settings?.seats;
  const held = seats ? seats.used + seats.pendingInvites : 0;
  const pct = seats && seats.limit ? Math.min(100, (held / seats.limit) * 100) : 0;
  const full = Boolean(seats && seats.limit !== null && held >= seats.limit);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const token = await onInvite(email, role);
    setBusy(false);
    if (token) {
      setLink({ email, url: `${window.location.origin}/?invite=${token}` });
      setEmail("");
      setCopied(false);
    }
  }

  async function copy() {
    if (!link) return;
    try { await navigator.clipboard.writeText(link.url); setCopied(true); } catch { setCopied(false); }
  }

  return (
    <Card className="ws-invite">
      <div className="db-card-header">
        <h3>Invite your team</h3>
        <p>Each person gets their own login and private expenses. Seats are held while an invite is pending.</p>
      </div>

      {seats && (
        <div className="ws-seats">
          <div className="ws-seats__row">
            <span>Seats</span>
            <span className="num">
              {seats.used} used{seats.pendingInvites > 0 ? ` + ${seats.pendingInvites} pending` : ""} of {seats.limit === null ? "unlimited" : seats.limit}
            </span>
          </div>
          {seats.limit !== null && (
            <div className="db-category-row__track"><div className={full ? "bg-row__fill--danger" : "db-category-row__fill"} style={{ width: `${pct}%`, height: "100%" }} /></div>
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <form className="ws-invite__form" onSubmit={submit}>
        <input type="email" required placeholder="colleague@company.com" aria-label="Invitee email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}>
          <option value="MEMBER">Member</option>
          {isOwner && <option value="ADMIN">Admin</option>}
        </select>
        <Button type="submit" disabled={busy || full}>{busy ? "Creating…" : full ? "No seats left" : "Create invite"}</Button>
      </form>

      {link && (
        <div className="ws-invite__link" role="status">
          <div>
            <strong>Invite for {link.email} is ready.</strong>
            <span>Email isn't sent automatically. Share this one-time link (valid 7 days).</span>
          </div>
          <code>{link.url}</code>
          <Button variant="secondary" onClick={copy}>{copied ? "Copied ✓" : "Copy link"}</Button>
        </div>
      )}

      {invitations.length > 0 && (
        <div className="ws-invite__list">
          <div className="ws-invite__label">Pending invitations</div>
          {invitations.map((i) => (
            <div className="ws-invite__item" key={i.id}>
              <span>{i.email}</span>
              <Badge tone={i.role === "ADMIN" ? "brand" : "neutral"}>{i.role}</Badge>
              <span className="ws-invite__exp">expires {new Date(i.expiresAt).toLocaleDateString()}</span>
              <button className="ws-remove" type="button" onClick={() => onRevoke(i.id)}>Revoke</button>
            </div>
          ))}
        </div>
      )}

      {isOwner && settings && (
        <label className="ws-invite__toggle">
          <input type="checkbox" checked={settings.inviteOnly} onChange={(e) => onToggleInviteOnly(e.target.checked)} />
          <span><strong>Invite-only workspace</strong> Only people you invite can join. Turn off to let anyone with the workspace slug join.</span>
        </label>
      )}
    </Card>
  );
}
