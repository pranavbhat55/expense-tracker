import type { FormEvent } from "react";
import { Button } from "../common/primitives";
import { ThemeToggle } from "../common/ThemeToggle";
import "./auth.css";

export type AuthMode = "signin" | "create";
export interface InviteState {
  status: "none" | "loading" | "ready" | "invalid";
  email?: string;
  role?: string;
  organization?: string;
  message?: string;
}

const POINTS = [
  { title: "Your team, each with private books", body: "Invite employees by email. Everyone sees only their own expenses." },
  { title: "Owners see the whole picture", body: "Team-wide spend, budgets and activity for owners and admins." },
  { title: "Offboard in one click", body: "Revoke access instantly. The records stay on your books." },
];

export function AuthScreen({
  mode, onModeChange, invite, name, email, password, loading, error,
  onNameChange, onEmailChange, onPasswordChange, onSubmit,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  invite: InviteState;
  name: string; email: string; password: string;
  loading: boolean; error: string;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const joining = invite.status === "ready";
  const creating = mode === "create" || joining;

  let heading = "Welcome back";
  let sub = "Sign in to your workspace.";
  if (joining) { heading = `Join ${invite.organization}`; sub = `You've been invited as ${invite.role === "ADMIN" ? "an admin" : "a team member"}. Set a password to get started.`; }
  else if (mode === "create") { heading = "Create your workspace"; sub = "Start free. Invite your team whenever you're ready."; }

  return (
    <main className="au-shell">
      <aside className="au-brand">
        <div className="au-brand__top">
          <span className="au-brand__mark">E</span>
          <span className="au-brand__name">Expenso</span>
        </div>
        <div className="au-brand__body">
          <h1>Expenses your whole organization can trust.</h1>
          <ul>
            {POINTS.map((p) => (
              <li key={p.title}>
                <strong>{p.title}</strong>
                <span>{p.body}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="au-brand__glyph" aria-hidden>₹</div>
      </aside>

      <section className="au-panel">
        <div className="au-panel__toggle"><ThemeToggle /></div>
        <div className="au-card">
          {invite.status === "loading" ? (
            <p className="au-muted">Checking your invitation…</p>
          ) : invite.status === "invalid" ? (
            <>
              <h2>This invitation can't be used</h2>
              <p className="au-muted">{invite.message ?? "The link is invalid."} Ask your workspace admin to send a new one.</p>
              <Button variant="secondary" onClick={() => { window.history.replaceState(null, "", window.location.pathname); window.location.reload(); }}>
                Go to sign in
              </Button>
            </>
          ) : (
            <>
              <h2>{heading}</h2>
              <p className="au-muted">{sub}</p>

              {error && <p className="au-error" role="alert">{error}</p>}

              <form className="au-form" onSubmit={onSubmit}>
                {creating && (
                  <div className="au-field">
                    <label htmlFor="name">Full name</label>
                    <input id="name" type="text" value={name} onChange={(e) => onNameChange(e.target.value)} autoComplete="name" required />
                  </div>
                )}
                <div className="au-field">
                  <label htmlFor="email">Work email</label>
                  <input id="email" type="email" value={joining ? invite.email ?? "" : email} onChange={(e) => onEmailChange(e.target.value)} readOnly={joining} autoComplete="email" required />
                </div>
                <div className="au-field">
                  <label htmlFor="password">Password</label>
                  <input id="password" type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} autoComplete={creating ? "new-password" : "current-password"} minLength={6} required />
                </div>
                <Button type="submit" disabled={loading} className="au-submit">
                  {loading ? "Please wait…" : joining ? "Accept invitation" : creating ? "Create workspace" : "Sign in"}
                </Button>
              </form>

              {!joining && (
                <button type="button" className="au-switch" onClick={() => onModeChange(mode === "signin" ? "create" : "signin")}>
                  {mode === "signin" ? "New here? Create a workspace" : "Already have an account? Sign in"}
                </button>
              )}
              {joining && <p className="au-fineprint">By accepting you'll join {invite.organization}'s workspace. Your expenses stay private to you.</p>}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
