import type { NavKey } from "./Sidebar";
import "./layout.css";

const ITEMS: { key: NavKey; label: string; icon: string }[] = [
  { key: "dashboard", label: "Home", icon: "▦" },
  { key: "expenses", label: "Expenses", icon: "▤" },
  { key: "budgets", label: "Budgets", icon: "◔" },
  { key: "timeline", label: "Timeline", icon: "⟶" },
];

export function MobileNavigation({ active, onNavigate }: { active: NavKey; onNavigate: (key: NavKey) => void }) {
  return (
    <nav className="mn-bar">
      {ITEMS.map((item) => (
        <button
          key={item.key}
          className={`mn-item ${active === item.key ? "mn-item--active" : ""}`}
          onClick={() => onNavigate(item.key)}
        >
          <span>{item.icon}</span>
          <span className="mn-item__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
