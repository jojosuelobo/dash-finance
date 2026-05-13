interface Props {
  expenseName: string;
  isIncome: boolean;
  onEditThisMonth: () => void;
  onEditFromHereForward: () => void;
  onEditAll: () => void;
  onClose: () => void;
}

export default function EditScopeModal({
  expenseName,
  isIncome,
  onEditThisMonth,
  onEditFromHereForward,
  onEditAll,
  onClose,
}: Props) {
  const btnClass =
    "w-full rounded-lg border border-zinc-200 px-4 py-3 text-left text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {isIncome ? "Editar receita mensal" : "Editar despesa fixa"}
        </h2>
        <p className="mt-1 mb-5 text-sm text-zinc-500 dark:text-zinc-400">
          Aplicar alteração em{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {expenseName}
          </span>
          :
        </p>

        <div className="flex flex-col gap-2">
          <button onClick={onEditThisMonth} className={btnClass}>
            Apenas este mês
          </button>
          <button onClick={onEditFromHereForward} className={btnClass}>
            Este e todos os próximos
          </button>
          <button onClick={onEditAll} className={btnClass}>
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
