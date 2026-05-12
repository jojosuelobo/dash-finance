"use client";

import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import ExpenseList from "@/components/ExpenseList";
import AddExpenseModal from "@/components/AddExpenseModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import ManageCategoriesModal from "@/components/ManageCategoriesModal";
import type { DisplayExpense, Expense } from "@/types/expense";

const MONTHS = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

function prevMonth(month: number, year: number) {
  return month === 0 ? { month: 11, year: year - 1 } : { month: month - 1, year };
}

function nextMonth(month: number, year: number) {
  return month === 11 ? { month: 0, year: year + 1 } : { month: month + 1, year };
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function Home() {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [addOpen, setAddOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  const { expenses, addExpense, deleteExpense, updateExpense } = useExpenses();
  const { categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory } = useCategories();

  const viewIdx = viewYear * 12 + viewMonth;

  const displayExpenses: DisplayExpense[] = expenses
    .filter((e) => {
      const anchor = e.dueDate ?? e.createdAt;
      const ref = new Date(anchor);
      const ry = ref.getFullYear();
      const rm = ref.getMonth();
      const startIdx = ry * 12 + rm;

      if (e.type === "one-time") {
        return ry === viewYear && rm === viewMonth;
      }

      // Skip excluded months
      if (e.excludedMonths?.includes(monthKey(viewYear, viewMonth))) return false;

      // Respect endDate (YYYY-MM, 1-based month)
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
      const categoryLabel = cat ? (sub ? `${cat.name} > ${sub.name}` : cat.name) : undefined;

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

  function goBack() {
    const p = prevMonth(viewMonth, viewYear);
    setViewMonth(p.month);
    setViewYear(p.year);
  }

  function goForward() {
    const n = nextMonth(viewMonth, viewYear);
    setViewMonth(n.month);
    setViewYear(n.year);
  }

  function handleDelete(id: string) {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;
    if (expense.type === "one-time" || expense.fixedMode === "installments" || expense.kind === "income") {
      deleteExpense(id);
    } else {
      setPendingDelete(expense);
    }
  }

  function hasPreviousOccurrences(expense: Expense): boolean {
    const anchor = expense.dueDate ?? expense.createdAt;
    const ref = new Date(anchor);
    const startIdx = ref.getFullYear() * 12 + ref.getMonth();
    return startIdx < viewIdx;
  }

  function handleDeleteThisMonth() {
    if (!pendingDelete) return;
    const key = monthKey(viewYear, viewMonth);
    updateExpense(pendingDelete.id, {
      excludedMonths: [...(pendingDelete.excludedMonths ?? []), key],
    });
    setPendingDelete(null);
  }

  function handleDeleteFromHereForward() {
    if (!pendingDelete) return;
    const prev = prevMonth(viewMonth, viewYear);
    updateExpense(pendingDelete.id, { endDate: monthKey(prev.year, prev.month) });
    setPendingDelete(null);
  }

  function handleTogglePaid(id: string) {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;
    const key = monthKey(viewYear, viewMonth);
    const current = expense.paidMonths ?? [];
    updateExpense(id, {
      paidMonths: current.includes(key)
        ? current.filter((m) => m !== key)
        : [...current, key],
    });
  }

  function handleDeleteAll() {
    if (!pendingDelete) return;
    deleteExpense(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          aria-label="Mês anterior"
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {MONTHS[viewMonth]} {viewYear}
        </h1>
        <button
          onClick={goForward}
          aria-label="Próximo mês"
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => setCategoriesOpen(true)}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-50"
        >
          CATEGORIAS
        </button>
        <button
          onClick={() => setAddOpen(true)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          ADICIONAR
        </button>
      </div>

      <ExpenseList
        expenses={displayExpenses}
        onDelete={handleDelete}
        onTogglePaid={handleTogglePaid}
        emptyMessage="Nenhuma despesa para este mês."
      />

      {addOpen && (
        <AddExpenseModal
          onAdd={addExpense}
          onClose={() => setAddOpen(false)}
          categories={categories}
        />
      )}

      {categoriesOpen && (
        <ManageCategoriesModal
          categories={categories}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
          onAddSubcategory={addSubcategory}
          onDeleteSubcategory={deleteSubcategory}
          onClose={() => setCategoriesOpen(false)}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmModal
          expense={pendingDelete}
          hasPreviousOccurrences={hasPreviousOccurrences(pendingDelete)}
          onDeleteThisMonth={handleDeleteThisMonth}
          onDeleteFromHereForward={handleDeleteFromHereForward}
          onDeleteAll={handleDeleteAll}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </>
  );
}
