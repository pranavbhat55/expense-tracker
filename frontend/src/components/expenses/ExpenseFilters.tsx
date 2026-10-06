import { Button, Card } from "../common/primitives";
import "./expenses.css";

export function ExpenseFilters({
  filterMonth,
  filterCategory,
  onFilterMonthChange,
  onFilterCategoryChange,
  onClear,
}: {
  filterMonth: string;
  filterCategory: string;
  onFilterMonthChange: (value: string) => void;
  onFilterCategoryChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <Card className="ex-filters">
      <div className="ex-filters__field">
        <label htmlFor="filter-month">Month</label>
        <input
          id="filter-month"
          type="month"
          value={filterMonth}
          onChange={(e) => onFilterMonthChange(e.target.value)}
        />
      </div>
      <div className="ex-filters__field">
        <label htmlFor="filter-category">Category</label>
        <input
          id="filter-category"
          type="text"
          placeholder="e.g. Food"
          value={filterCategory}
          onChange={(e) => onFilterCategoryChange(e.target.value)}
        />
      </div>
      <Button variant="secondary" type="button" onClick={onClear}>
        Clear filters
      </Button>
    </Card>
  );
}
