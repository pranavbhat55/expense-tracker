import type { FormEvent } from "react";
import { Button, Modal } from "../common/primitives";
import "./expenses.css";

export function ExpenseDrawer({
  open,
  onClose,
  isEditing,
  amount,
  category,
  date,
  note,
  maxDate,
  loading,
  onAmountChange,
  onCategoryChange,
  onDateChange,
  onNoteChange,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  isEditing: boolean;
  amount: string;
  category: string;
  date: string;
  note: string;
  maxDate: string;
  loading: boolean;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit expense" : "Add expense"}>
      <form className="ex-drawer-form" onSubmit={onSubmit}>
        <div className="ex-drawer-form__field">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            required
          />
        </div>

        <div className="ex-drawer-form__field">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            required
          />
        </div>

        <div className="ex-drawer-form__field">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" max={maxDate} value={date} onChange={(e) => onDateChange(e.target.value)} required />
        </div>

        <div className="ex-drawer-form__field">
          <label htmlFor="note">Note</label>
          <input id="note" type="text" value={note} onChange={(e) => onNoteChange(e.target.value)} />
        </div>

        <div className="ex-drawer-form__actions">
          {isEditing && (
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : isEditing ? "Update expense" : "Add expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
