import "./layout.css";

export function TopBar({
  title,
  userEmail,
  onLogout,
  onMenuClick,
}: {
  title: string;
  userEmail: string;
  onLogout: () => void;
  onMenuClick?: () => void;
}) {
  return (
    <header className="tb-topbar">
      <button className="tb-menu-btn" onClick={onMenuClick} aria-label="Open menu">
        ☰
      </button>
      <h1 className="tb-title">{title}</h1>
      <div className="tb-user">
        <span className="tb-user__email">{userEmail}</span>
        <button className="ui-btn ui-btn--ghost" onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}
