import "./primitives.css";

export function ScopeToggle({ value, onChange }: { value: "mine" | "team"; onChange: (v: "mine" | "team") => void }) {
  return (
    <div className={`ui-seg ${value === "team" ? "ui-seg--right" : ""}`} role="group" aria-label="Expense scope">
      <span className="ui-seg__thumb" aria-hidden />
      {(["mine", "team"] as const).map((v) => (
        <button key={v} type="button" className={`ui-seg__btn ${value === v ? "ui-seg__btn--on" : ""}`} aria-pressed={value === v} onClick={() => onChange(v)}>
          {v === "mine" ? "My spending" : "Whole team"}
        </button>
      ))}
    </div>
  );
}
