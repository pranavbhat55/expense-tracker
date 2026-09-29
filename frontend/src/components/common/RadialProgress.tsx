export function RadialProgress({ pct, tone, size = 56, label }: { pct: number; tone: "success" | "warning" | "danger"; size?: number; label?: string }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const color = tone === "danger" ? "var(--danger-500)" : tone === "warning" ? "var(--warning-500)" : "var(--success-500)";
  return (
    <div className="ui-radial" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ink-100)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (clamped / 100) * c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} className="ui-radial__arc"
        />
      </svg>
      {label !== undefined && <span className="ui-radial__label">{label}</span>}
    </div>
  );
}
