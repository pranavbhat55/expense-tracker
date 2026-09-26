import { Button, Card, EmptyState, LoadingState } from "../common/primitives";
import type { AuditLog } from "../../api/workspace";
import { describeAuditLog } from "./auditUtils";
import "./workspace.css";

export function ActivitySection({
  logs,
  loading,
  error,
  page,
  totalPages,
  onPageChange,
}: {
  logs: AuditLog[];
  loading: boolean;
  error: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card>
      <div className="db-card-header">
        <h2>Workspace activity</h2>
        <p>A tenant-scoped record of workspace changes.</p>
      </div>

      {error && <p className="error ws-error">{error}</p>}

      {loading ? (
        <LoadingState label="Loading activity…" />
      ) : logs.length === 0 ? (
        <EmptyState title="No activity yet" description="Workspace changes will be recorded here." />
      ) : (
        <div className="ws-audit-list">
          {logs.map((log) => (
            <div className="ws-audit-item" key={log.id}>
              <div className="ws-audit-item__dot" />
              <div>
                <div className="ws-audit-item__text">{describeAuditLog(log)}</div>
                <time className="ws-audit-item__time">{new Date(log.createdAt).toLocaleString()}</time>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="ws-pagination">
          <Button variant="secondary" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button variant="secondary" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </Card>
  );
}
