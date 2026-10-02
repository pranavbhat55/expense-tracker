import type { FormEvent } from "react";
import { Button, Modal } from "../common/primitives";
import "../expenses/expenses.css";
import "./budgets.css";

export function BudgetForm({
  open,
  onClose,
  isEditing,
  amount,
  category,
  month,
  loading,
  onAmountChange,
  onCategoryChange,
  onMonthChange,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  isEditing: boolean;
  amount: string;
  category: string;
  month: string;
  loading: boolean;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit budget" : "Set a budget"}>
      <form className="ex-drawer-form" onSubmit={onSubmit}>
        <div className="ex-drawer-form__field">
          <label htmlFor="budget-amount">Monthly limit</label>
          <input
            id="budget-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            required
          />
        </div>
        <div className="ex-drawer-form__field">
          <label htmlFor="budget-category">Category</label>
          <input id="budget-category" type="text" value={category} onChange={(e) => onCategoryChange(e.target.value)} required />
        </div>
        <div className="ex-drawer-form__field">
          <label htmlFor="budget-month">Month</label>
          <input id="budget-month" type="month" value={month} onChange={(e) => onMonthChange(e.target.value)} required />
        </div>
        <div className="ex-drawer-form__actions">
          {isEditing && (
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : isEditing ? "Update budget" : "Set budget"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
