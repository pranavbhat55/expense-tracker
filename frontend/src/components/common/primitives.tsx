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
    <div className="ui-loading">
      <span className="ui-spinner" aria-hidden />
      <span>{label}</span>
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
  if (!open) return null;
  return (
    <div className="ui-modal__overlay" onClick={onClose}>
      <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
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
