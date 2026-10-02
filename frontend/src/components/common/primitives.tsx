import { useEffect, useState } from "react";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import "./primitives.css";

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`ui-card ${padded ? "ui-card--padded" : ""} ${className}`}>
      {children}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`ui-btn ui-btn--${variant} ${className}`} {...props} />;
}

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "brand";

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="ui-empty">
      <div className="ui-empty__title">{title}</div>
      {description && <div className="ui-empty__desc">{description}</div>}
      {action && <div className="ui-empty__action">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="ui-skeletons" role="status" aria-busy="true" aria-label={label}>
      {[92, 78, 86, 64].map((w, i) => (
        <span key={i} className="ui-skeleton" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="ui-error">
      <div>{message}</div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 180);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted) return null;
  return (
    <div className={`ui-modal__overlay ${visible ? "ui-modal__overlay--visible" : ""}`} onClick={onClose}>
      <div className={`ui-modal ${visible ? "ui-modal--visible" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="ui-modal__header">
          <h3>{title}</h3>
          <button className="ui-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="ui-modal__body">{children}</div>
      </div>
    </div>
  );
}
