import type { DisplayExpense } from "@/types/expense";

interface Props {
  expense: DisplayExpense;
  onDelete?: (id: string) => void;
  onTogglePaid?: (id: string) => void;
}

export default function ExpenseCard({ expense, onDelete, onTogglePaid }: Props) {
  const { isPaid, isOverdue } = expense;
  const isIncome = expense.kind === "income";

  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(expense.displayValue);

  const dueDay = expense.dueDate
    ? parseInt(expense.dueDate.split("-")[2])
    : undefined;

  const cardBg =
    isPaid && isIncome
      ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
      : isPaid
      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
      : isOverdue
      ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
      : isIncome
      ? "border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/30"
      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";

  const toggleBg =
    isPaid && isIncome
      ? "border-blue-500 bg-blue-500 text-white"
      : isPaid
      ? "border-green-500 bg-green-500 text-white"
      : isOverdue
      ? "border-red-400 hover:border-green-400 dark:border-red-500 dark:hover:border-green-500"
      : isIncome
      ? "border-teal-400 hover:border-blue-400 dark:border-teal-500 dark:hover:border-blue-500"
      : "border-zinc-300 hover:border-green-400 dark:border-zinc-600 dark:hover:border-green-500";

  const nameColor =
    isPaid && isIncome
      ? "text-blue-800 dark:text-blue-300"
      : isPaid
      ? "text-green-800 dark:text-green-300"
      : isOverdue
      ? "text-red-700 dark:text-red-300"
      : isIncome
      ? "text-teal-800 dark:text-teal-200"
      : "text-zinc-900 dark:text-zinc-50";

  const valueColor =
    isPaid && isIncome
      ? "text-blue-700 dark:text-blue-400"
      : isPaid
      ? "text-green-700 dark:text-green-400"
      : isOverdue
      ? "text-red-600 dark:text-red-400"
      : isIncome
      ? "text-teal-700 dark:text-teal-300"
      : "text-zinc-900 dark:text-zinc-50";

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${cardBg}`}>
      {/* Paid/received toggle */}
      <button
        onClick={() => onTogglePaid?.(expense.id)}
        aria-label={
          isIncome
            ? isPaid ? "Marcar como não recebido" : "Marcar como recebido"
            : isPaid ? "Marcar como não paga" : "Marcar como paga"
        }
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${toggleBg}`}
      >
        {isPaid && (
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Name + meta */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className={`text-sm font-medium truncate ${nameColor}`}>
          {expense.name}
        </span>
        {dueDay && (
          <span className="text-xs text-zinc-400">
            {isIncome ? "recebe dia" : "vence dia"} {dueDay}
          </span>
        )}
        {expense.categoryLabel && (
          <span className="text-xs text-zinc-400">{expense.categoryLabel}</span>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {isIncome ? (
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            {expense.type === "fixed" ? "Mensal" : "Único"}
          </span>
        ) : (
          <span
            className={
              expense.type === "fixed"
                ? "rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }
          >
            {expense.type === "fixed"
              ? expense.fixedMode === "installments" ? "Parcelada" : "Fixa"
              : "Avulsa"}
          </span>
        )}
        {expense.installmentInfo && (
          <span className="text-xs text-zinc-400">{expense.installmentInfo}</span>
        )}
        <span className={`text-sm font-semibold ${valueColor}`}>
          {isIncome && !isPaid ? `+${formatted}` : formatted}
        </span>
        {onDelete && (
          <button
            onClick={() => onDelete(expense.id)}
            aria-label="Deletar"
            className="ml-1 rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
