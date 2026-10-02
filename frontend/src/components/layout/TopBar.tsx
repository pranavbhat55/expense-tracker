import { Badge } from "../common/primitives";
import { initials } from "../../utils/format";
import "./layout.css";

export function TopBar({
  title, userName, userEmail, role, onLogout, onMenuClick,
}: {
  title: string;
  userName: string;
  userEmail: string;
  role?: string;
  onLogout: () => void;
  onMenuClick?: () => void;
}) {
  const display = userName || userEmail || "Account";
  return (
    <header className="tb-topbar">
      <button className="tb-menu-btn" onClick={onMenuClick} aria-label="Open menu">☰</button>
      <h1 className="tb-title">{title}</h1>
      <div className="tb-user">
        {role && <Badge tone={role === "OWNER" ? "brand" : "neutral"}>{role}</Badge>}
        <div className="tb-user__who">
          <span className="tb-avatar" aria-hidden>{initials(display)}</span>
          <span className="tb-user__text">
            <strong>{userName || "Signed in"}</strong>
            {userEmail && <small>{userEmail}</small>}
          </span>
        </div>
        <button className="ui-btn ui-btn--ghost" onClick={onLogout}>Log out</button>
      </div>
    </header>
  );
}
