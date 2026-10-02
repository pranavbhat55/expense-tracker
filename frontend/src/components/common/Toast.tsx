import { useEffect, useState } from "react";

export interface ToastMessage { id: number; text: string; tone?: "success" | "danger" }

let nextId = 1;
const listeners = new Set<(msg: ToastMessage) => void>();

/** Fire-and-forget: any component can call this without needing a provider/context. */
export function showToast(text: string, tone: ToastMessage["tone"] = "success") {
  const msg = { id: nextId++, text, tone };
  listeners.forEach((fn) => fn(msg));
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const onMsg = (msg: ToastMessage) => {
      setToasts((cur) => [...cur, msg]);
      setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== msg.id)), 3200);
    };
    listeners.add(onMsg);
    return () => { listeners.delete(onMsg); };
  }, []);

  if (toasts.length === 0) return null;
  return (
    <div className="ui-toast-host" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`ui-toast ui-toast--${t.tone ?? "success"}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
