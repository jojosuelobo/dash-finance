"use client";

import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/contexts/AuthContext";
import ExpenseList from "@/components/ExpenseList";
import AddExpenseModal from "@/components/AddExpenseModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import EditScopeModal from "@/components/EditScopeModal";
import ManageCategoriesModal from "@/components/ManageCategoriesModal";
import CalendarView from "@/components/CalendarView";
import { getDisplayExpenses, monthKey } from "@/lib/expenseFilter";
import type { Expense } from "@/types/expense";

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

export default function Home() {
  const { user } = useAuth();
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [addOpen, setAddOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [pendingEdit, setPendingEdit] = useState<{
    original: Expense;
    formData: Omit<Expense, "id" | "createdAt">;
  } | null>(null);

  const { expenses, addExpense, deleteExpense, updateExpense } = useExpenses(user!.userId);
  const { categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory } = useCategories(user!.userId);

  const viewIdx = viewYear * 12 + viewMonth;

  const displayExpenses = getDisplayExpenses(expenses, categories, viewYear, viewMonth, now);
  const incomeItems = displayExpenses.filter((e) => e.kind === "income");
  const expenseItems = displayExpenses.filter((e) => e.kind !== "income");
  const hasBothKinds = incomeItems.length > 0 && expenseItems.length > 0;

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const totalIncome = incomeItems.reduce((s, e) => s + e.displayValue, 0);
  const totalExpenses = expenseItems.reduce((s, e) => s + e.displayValue, 0);
  const balance = totalIncome - totalExpenses;

  const unpaidItems = expenseItems
    .filter((e) => !e.isPaid)
    .sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue));
  const totalUnpaid = unpaidItems.reduce((s, e) => s + e.displayValue, 0);

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
    if (expense.type === "one-time" || expense.fixedMode === "installments") {
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

  function needsEditScope(expense: Expense): boolean {
    return (
      (expense.type === "fixed" && expense.fixedMode === "unlimited") ||
      (expense.kind === "income" && expense.type === "fixed")
    );
  }

  function handleEditOpen(id: string) {
    const expense = expenses.find((e) => e.id === id);
    if (expense) setEditingExpense(expense);
  }

  function handleEditFormSubmit(data: Omit<Expense, "id" | "createdAt">) {
    if (!editingExpense) return;
    if (needsEditScope(editingExpense)) {
      setPendingEdit({ original: editingExpense, formData: data });
      setEditingExpense(null);
    } else {
      const { paidMonths: _pm, ...rest } = data;
      updateExpense(editingExpense.id, rest);
      setEditingExpense(null);
    }
  }

  function adjustToViewMonth(dateStr?: string): string {
    const day = dateStr ? dateStr.split("-")[2] : "01";
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${day}`;
  }

  function handleEditThisMonth() {
    if (!pendingEdit) return;
    const { original, formData } = pendingEdit;
    const key = monthKey(viewYear, viewMonth);
    updateExpense(original.id, {
      excludedMonths: [...(original.excludedMonths ?? []), key],
    });
    const wasPaid = original.paidMonths?.includes(key) ?? false;
    addExpense({
      ...formData,
      type: "one-time",
      fixedMode: undefined,
      installments: undefined,
      dueDate: adjustToViewMonth(formData.dueDate),
      paidMonths: wasPaid ? [key] : undefined,
    });
    setPendingEdit(null);
  }

  function handleEditFromHereForward() {
    if (!pendingEdit) return;
    const { original, formData } = pendingEdit;
    const prev = prevMonth(viewMonth, viewYear);
    updateExpense(original.id, { endDate: monthKey(prev.year, prev.month) });
    addExpense({
      ...formData,
      dueDate: adjustToViewMonth(formData.dueDate),
      paidMonths: undefined,
    });
    setPendingEdit(null);
  }

  function handleEditAll() {
    if (!pendingEdit) return;
    const { original, formData } = pendingEdit;
    const { paidMonths: _pm, ...rest } = formData;
    updateExpense(original.id, rest);
    setPendingEdit(null);
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
          onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
          aria-label={viewMode === "list" ? "Visualização calendário" : "Visualização lista"}
          className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-50"
        >
          {viewMode === "list" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          )}
        </button>
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

      {displayExpenses.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-400">Receitas</p>
            <p className="mt-0.5 text-sm font-semibold text-teal-600 dark:text-teal-400">
              {fmt(totalIncome)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-400">Despesas</p>
            <p className="mt-0.5 text-sm font-semibold text-red-500 dark:text-red-400">
              {fmt(totalExpenses)}
            </p>
          </div>
          <div
            className={`rounded-lg border p-3 ${
              balance >= 0
                ? "border-green-100 bg-green-50 dark:border-green-900/40 dark:bg-green-950/30"
                : "border-red-100 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30"
            }`}
          >
            <p className="text-xs text-zinc-400">Saldo</p>
            <p
              className={`mt-0.5 text-sm font-semibold ${
                balance >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {fmt(balance)}
            </p>
          </div>
        </div>
      )}

      {unpaidItems.length > 0 && (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              A pagar
            </span>
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {fmt(totalUnpaid)}
            </span>
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {unpaidItems.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  {e.isOverdue ? (
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                  ) : (
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  )}
                  <span className={`truncate text-xs ${e.isOverdue ? "text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-300"}`}>
                    {e.name}
                  </span>
                </span>
                <span className="flex-shrink-0 text-xs text-zinc-400">
                  {fmt(e.displayValue)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {displayExpenses.length === 0 && (
        <p className="mt-8 text-center text-sm text-zinc-400">
          Nenhum lançamento para este mês.
        </p>
      )}

      {viewMode === "calendar" ? (
        displayExpenses.length > 0 && (
          <CalendarView
            expenses={displayExpenses}
            viewYear={viewYear}
            viewMonth={viewMonth}
            onTogglePaid={handleTogglePaid}
            onEdit={handleEditOpen}
            onDelete={handleDelete}
          />
        )
      ) : (
        <>
          {incomeItems.length > 0 && (
            <section>
              {hasBothKinds && (
                <h2 className="mt-6 mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Receitas
                </h2>
              )}
              <ExpenseList
                expenses={incomeItems}
                onDelete={handleDelete}
                onTogglePaid={handleTogglePaid}
                onEdit={handleEditOpen}
              />
            </section>
          )}

          {expenseItems.length > 0 && (
            <section>
              {hasBothKinds && (
                <h2 className="mt-6 mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Despesas
                </h2>
              )}
              <ExpenseList
                expenses={expenseItems}
                categories={categories}
                onDelete={handleDelete}
                onTogglePaid={handleTogglePaid}
                onEdit={handleEditOpen}
              />
            </section>
          )}
        </>
      )}

      {addOpen && (
        <AddExpenseModal
          onAdd={addExpense}
          onClose={() => setAddOpen(false)}
          categories={categories}
        />
      )}

      {editingExpense && (
        <AddExpenseModal
          onAdd={handleEditFormSubmit}
          onClose={() => setEditingExpense(null)}
          categories={categories}
          initialExpense={editingExpense}
        />
      )}

      {pendingEdit && (
        <EditScopeModal
          expenseName={pendingEdit.original.name}
          isIncome={pendingEdit.original.kind === "income"}
          onEditThisMonth={handleEditThisMonth}
          onEditFromHereForward={handleEditFromHereForward}
          onEditAll={handleEditAll}
          onClose={() => setPendingEdit(null)}
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
