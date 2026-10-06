export function formatCurrency(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits }).format(value);
}

/** Indian short scale (K / L / Cr), computed by hand so axis labels never depend on ICU data. */
export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  const trim = (n: number) => (Math.round(n * 10) / 10).toString();
  if (abs >= 1e7) return `₹${trim(value / 1e7)}Cr`;
  if (abs >= 1e5) return `₹${trim(value / 1e5)}L`;
  if (abs >= 1e3) return `₹${trim(value / 1e3)}K`;
  return `₹${Math.round(value)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]![0]! : "")).toUpperCase() || "?";
}
