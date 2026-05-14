import type { DisplayExpense } from "@/types/expense";

interface Props {
  expenses: DisplayExpense[];
  viewYear: number;
  viewMonth: number;
  onTogglePaid: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const DAY_HEADERS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function itemBg(e: DisplayExpense) {
  if (e.isPaid && e.kind === "income")
    return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";
  if (e.isPaid)
    return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
  if (e.isOverdue)
    return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
  if (e.kind === "income")
    return "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800";
  return "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800";
}

function nameColor(e: DisplayExpense) {
  if (e.isPaid && e.kind === "income") return "text-blue-800 dark:text-blue-300";
  if (e.isPaid) return "text-green-800 dark:text-green-300";
  if (e.isOverdue) return "text-red-700 dark:text-red-300";
  if (e.kind === "income") return "text-teal-800 dark:text-teal-200";
  return "text-zinc-900 dark:text-zinc-50";
}

function valueColor(e: DisplayExpense) {
  if (e.isPaid && e.kind === "income") return "text-blue-700 dark:text-blue-400";
  if (e.isPaid) return "text-green-700 dark:text-green-400";
  if (e.isOverdue) return "text-red-600 dark:text-red-400";
  if (e.kind === "income") return "text-teal-700 dark:text-teal-300";
  return "text-zinc-900 dark:text-zinc-50";
}

function toggleBg(e: DisplayExpense) {
  if (e.isPaid && e.kind === "income") return "border-blue-500 bg-blue-500 text-white";
  if (e.isPaid) return "border-green-500 bg-green-500 text-white";
  if (e.isOverdue) return "border-red-400 dark:border-red-500";
  if (e.kind === "income") return "border-teal-400 dark:border-teal-500";
  return "border-zinc-300 dark:border-zinc-600";
}

function ExpenseEntry({
  expense,
  onTogglePaid,
  onEdit,
}: {
  expense: DisplayExpense;
  onTogglePaid: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-center gap-1 rounded border px-1.5 py-1 ${itemBg(expense)}`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePaid(expense.id); }}
        aria-label={
          expense.kind === "income"
            ? expense.isPaid ? "Marcar como não recebido" : "Marcar como recebido"
            : expense.isPaid ? "Marcar como não paga" : "Marcar como paga"
        }
        className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${toggleBg(expense)}`}
      >
        {expense.isPaid && (
          <svg xmlns="http://www.w3.org/2000/svg" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <button
        onClick={() => onEdit(expense.id)}
        className={`flex min-w-0 flex-1 items-center gap-1 text-left`}
      >
        <span className={`flex-1 truncate text-xs font-medium ${nameColor(expense)}`}>
          {expense.name}
          {expense.installmentInfo && (
            <span className="ml-1 font-normal text-zinc-400">{expense.installmentInfo}</span>
          )}
        </span>
        <span className={`flex-shrink-0 text-xs font-semibold ${valueColor(expense)}`}>
          {expense.kind === "income" && !expense.isPaid ? `+${fmt(expense.displayValue)}` : fmt(expense.displayValue)}
        </span>
      </button>
    </div>
  );
}

export default function CalendarView({ expenses, viewYear, viewMonth, onTogglePaid, onEdit }: Props) {
  const now = new Date();
  const today = now.getDate();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Adjust so Monday = 0, ..., Sunday = 6
  const rawFirst = new Date(viewYear, viewMonth, 1).getDay();
  const firstDayOffset = rawFirst === 0 ? 6 : rawFirst - 1;

  const byDay = new Map<number, DisplayExpense[]>();
  const noDueDate: DisplayExpense[] = [];

  for (const e of expenses) {
    if (!e.dueDate) {
      noDueDate.push(e);
      continue;
    }
    const day = parseInt(e.dueDate.split("-")[2], 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(e);
  }

  const totalCells = firstDayOffset + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[420px]">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="py-1 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {h}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden">
        {Array.from({ length: rows * 7 }).map((_, idx) => {
          const day = idx - firstDayOffset + 1;
          const isValidDay = day >= 1 && day <= daysInMonth;
          const isToday = isCurrentMonth && day === today;
          const dayExpenses = isValidDay ? (byDay.get(day) ?? []) : [];

          return (
            <div
              key={idx}
              className={`min-h-[80px] p-1.5 ${
                isValidDay
                  ? "bg-white dark:bg-zinc-900"
                  : "bg-zinc-50 dark:bg-zinc-950"
              }`}
            >
              {isValidDay && (
                <>
                  <span
                    className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                      isToday
                        ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                        : "text-zinc-400"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {dayExpenses.map((e) => (
                      <ExpenseEntry
                        key={e.id}
                        expense={e}
                        onTogglePaid={onTogglePaid}
                        onEdit={onEdit}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {noDueDate.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Sem data
          </p>
          <div className="flex flex-col gap-1">
            {noDueDate.map((e) => (
              <ExpenseEntry
                key={e.id}
                expense={e}
                onTogglePaid={onTogglePaid}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
