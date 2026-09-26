import "./layout.css";

export type NavKey =
  | "dashboard"
  | "expenses"
  | "budgets"
  | "timeline"
  | "members"
  | "activity"
  | "billing"
  | "admin";

interface NavItem {
  key: NavKey;
  label: string;
  icon: string;
}

const PRIMARY_NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "▦" },
  { key: "expenses", label: "Expenses", icon: "▤" },
  { key: "budgets", label: "Budgets", icon: "◔" },
  { key: "timeline", label: "Timeline", icon: "⟶" },
];

const WORKSPACE_NAV: NavItem[] = [
  { key: "members", label: "Members", icon: "◎" },
  { key: "activity", label: "Activity", icon: "▧" },
];

export function Sidebar({
  active,
  onNavigate,
  workspaceName,
  canViewMembers,
  canViewBilling,
  canViewAdmin,
  plan,
}: {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  workspaceName: string;
  canViewMembers: boolean;
  canViewBilling: boolean;
  canViewAdmin: boolean;
  plan: string;
}) {
  const renderItem = (item: NavItem) => (
    <button
      key={item.key}
      className={`sb-nav-item ${active === item.key ? "sb-nav-item--active" : ""}`}
      onClick={() => onNavigate(item.key)}
    >
      <span className="sb-nav-item__icon">{item.icon}</span>
      {item.label}
    </button>
  );

  return (
    <aside className="sb-sidebar">
      <div className="sb-brand">
        <div className="sb-brand__mark">E</div>
        <div className="sb-brand__text">
          <div className="sb-brand__name">Expenso</div>
          <div className="sb-brand__workspace">{workspaceName}</div>
        </div>
      </div>

      <nav className="sb-nav">
        <div className="sb-nav__group">{PRIMARY_NAV.map(renderItem)}</div>

        {canViewMembers && (
          <div className="sb-nav__group">
            <div className="sb-nav__label">Workspace</div>
            {WORKSPACE_NAV.map(renderItem)}
          </div>
        )}

        {canViewBilling && (
          <div className="sb-nav__group">
            <div className="sb-nav__label">Account</div>
            {renderItem({ key: "billing", label: "Billing", icon: "◈" })}
          </div>
        )}

        {canViewAdmin && (
          <div className="sb-nav__group">
            <div className="sb-nav__label">Platform</div>
            {renderItem({ key: "admin", label: "Admin", icon: "⬢" })}
          </div>
        )}
      </nav>

      <div className="sb-plan">
        <span className="sb-plan__dot" />
        {plan} plan
      </div>
    </aside>
  );
}
