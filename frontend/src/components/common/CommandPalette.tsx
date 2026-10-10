import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./palette.css";

export interface PaletteCommand {
  id: string;
  label: string;
  hint?: string;
  group: string;
  keywords?: string;
  run: () => void;
}

/** Cmd/Ctrl+K quick-action palette: navigation and common actions from the keyboard.
 *  Substring match over label + keywords + group; arrow keys + Enter; Esc closes. */
export function CommandPalette({ commands }: { commands: PaletteCommand[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setActive(0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.keywords ?? ""} ${c.group}`.toLowerCase().includes(q));
  }, [commands, query]);

  function runAt(index: number) {
    const cmd = results[index];
    if (!cmd) return;
    setOpen(false);
    cmd.run();
  }

  if (!open) return null;

  // Group headings only when not searching, so results read as one ranked list while typing.
  const showGroups = query.trim() === "";

  return createPortal(
    <div className="cp-overlay" onMouseDown={() => setOpen(false)}>
      <div className="cp-panel" role="dialog" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cp-input"
          placeholder="Type a command or search…"
          aria-label="Search commands"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); runAt(active); }
          }}
        />
        <div className="cp-list" role="listbox">
          {results.length === 0 && <div className="cp-empty">No matching commands</div>}
          {results.map((c, i) => {
            const heading = showGroups && c.group !== results[i - 1]?.group ? c.group : null;
            return (
              <div key={c.id}>
                {heading && <div className="cp-group">{heading}</div>}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className={`cp-item ${i === active ? "cp-item--active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => runAt(i)}
                >
                  <span>{c.label}</span>
                  {c.hint && <kbd className="cp-kbd">{c.hint}</kbd>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="cp-footer">
          <span><kbd className="cp-kbd">↑↓</kbd> navigate</span>
          <span><kbd className="cp-kbd">↵</kbd> select</span>
          <span><kbd className="cp-kbd">esc</kbd> close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
