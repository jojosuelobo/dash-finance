import type { Expense } from "@/types/expense";

interface Props {
  expense: Expense;
  hasPreviousOccurrences: boolean;
  onDeleteThisMonth: () => void;
  onDeleteFromHereForward: () => void;
  onDeleteAll: () => void;
  onClose: () => void;
}

export default function DeleteConfirmModal({
  expense,
  hasPreviousOccurrences,
  onDeleteThisMonth,
  onDeleteFromHereForward,
  onDeleteAll,
  onClose,
}: Props) {
  const isIncome = expense.kind === "income";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {isIncome ? "Excluir receita mensal" : "Excluir despesa fixa"}
        </h2>
        <p className="mt-1 mb-5 text-sm text-zinc-500 dark:text-zinc-400">
          Como deseja excluir{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {expense.name}
          </span>
          ?
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onDeleteThisMonth}
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-left text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            Apenas este mês
          </button>

          {hasPreviousOccurrences && (
            <button
              onClick={onDeleteFromHereForward}
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-left text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              Este e todos os próximos
            </button>
          )}

          <button
            onClick={onDeleteAll}
            className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
          >
            Todos os registros
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-500 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
