import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./primitives.css";

/* eslint-disable react-refresh/only-export-components -- notify()/ToastMessage share this file with ToastHost by design */

export interface ToastMessage { id: number; text: string }
let nextId = 1;
let push: ((text: string) => void) | null = null;

/** Fire-and-forget confirmation toast. Used for actions (save, delete, invite, deactivate) that
 *  already close a drawer or update a list - the user needs a brief "it worked", not a modal. */
export function notify(text: string) {
  push?.(text);
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    push = (text: string) => {
      const id = nextId++;
      setToasts((t) => [...t, { id, text }]);
      setTimeout(() => setToasts((t) => t.filter((m) => m.id !== id)), 2600);
    };
    return () => { push = null; };
  }, []);

  if (toasts.length === 0) return null;
  return createPortal(
    <div className="ui-toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div className="ui-toast" key={t.id}>
          <span className="ui-toast__dot" aria-hidden />
          {t.text}
        </div>
      ))}
    </div>,
    document.body,
  );
}
