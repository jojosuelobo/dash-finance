import type { DisplayExpense, Expense } from "@/types/expense";
import type { Category } from "@/types/category";

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function getDisplayExpenses(
  expenses: Expense[],
  categories: Category[],
  viewYear: number,
  viewMonth: number,
  now: Date
): DisplayExpense[] {
  const viewIdx = viewYear * 12 + viewMonth;

  return expenses
    .filter((e) => {
      const anchor = e.dueDate ?? e.createdAt;
      const ref = new Date(anchor);
      const ry = ref.getFullYear();
      const rm = ref.getMonth();
      const startIdx = ry * 12 + rm;

      if (e.type === "one-time") {
        return ry === viewYear && rm === viewMonth;
      }

      if (e.excludedMonths?.includes(monthKey(viewYear, viewMonth))) return false;

      if (e.endDate) {
        const [ey, em] = e.endDate.split("-").map(Number);
        const endIdx = ey * 12 + (em - 1);
        if (viewIdx > endIdx) return false;
      }

      if (e.fixedMode === "installments" && e.installments) {
        return viewIdx >= startIdx && viewIdx < startIdx + e.installments;
      }

      return startIdx <= viewIdx;
    })
    .map((e) => {
      const key = monthKey(viewYear, viewMonth);
      const isPaid = e.paidMonths?.includes(key) ?? false;
      const dueDay = e.dueDate ? parseInt(e.dueDate.split("-")[2]) : undefined;
      const isOverdue =
        (e.kind ?? "expense") === "expense" &&
        !isPaid &&
        dueDay !== undefined &&
        new Date(viewYear, viewMonth, dueDay) < now;
      const cat = categories.find((c) => c.id === e.categoryId);
      const sub = cat?.subcategories.find((s) => s.id === e.subcategoryId);
      const categoryLabel = cat
        ? sub
          ? `${cat.name} > ${sub.name}`
          : cat.name
        : undefined;

      if (e.type === "fixed" && e.fixedMode === "installments" && e.installments) {
        const anchor = e.dueDate ?? e.createdAt;
        const ref = new Date(anchor);
        const startIdx = ref.getFullYear() * 12 + ref.getMonth();
        const num = viewIdx - startIdx + 1;
        return {
          ...e,
          displayValue: e.value / e.installments,
          installmentInfo: `${num}/${e.installments}`,
          isPaid,
          isOverdue,
          categoryLabel,
        };
      }
      return { ...e, displayValue: e.value, isPaid, isOverdue, categoryLabel };
    });
}
