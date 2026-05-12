import type { DisplayExpense } from "@/types/expense";
import ExpenseCard from "./ExpenseCard";

interface Props {
  expenses: DisplayExpense[];
  onDelete?: (id: string) => void;
  onTogglePaid?: (id: string) => void;
  emptyMessage?: string;
}

export default function ExpenseList({ expenses, onDelete, onTogglePaid, emptyMessage }: Props) {
  if (expenses.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-zinc-400">
        {emptyMessage ?? "Nenhuma despesa cadastrada ainda."}
      </p>
    );
  }

  return (
    <ul className="mt-4 flex flex-col gap-2">
      {expenses.map((expense) => (
        <li key={expense.id}>
          <ExpenseCard expense={expense} onDelete={onDelete} onTogglePaid={onTogglePaid} />
        </li>
      ))}
    </ul>
  );
}
