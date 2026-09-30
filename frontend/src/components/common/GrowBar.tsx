import { useEffect, useState } from "react";

/** A horizontal fill bar that animates from 0 to its target width on mount/update. */
export function GrowBar({ pct, className }: { pct: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDisplay(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);
  return <div className={className} style={{ width: `${Math.max(0, Math.min(100, display))}%` }} />;
}
