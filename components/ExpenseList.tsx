import type { DisplayExpense } from "@/types/expense";
import type { Category } from "@/types/category";
import ExpenseCard from "./ExpenseCard";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  expenses: DisplayExpense[];
  categories?: Category[];
  onDelete?: (id: string) => void;
  onTogglePaid?: (id: string) => void;
  onEdit?: (id: string) => void;
  emptyMessage?: string;
}

type SubGroup = { subcategoryId?: string; name?: string; items: DisplayExpense[] };
type Group = { categoryId?: string; name: string; subGroups: SubGroup[] };

function buildGroups(expenses: DisplayExpense[], categories: Category[]): Group[] {
  const groupOrder: string[] = [];
  const groupMap = new Map<string, Group>();

  for (const e of expenses) {
    const catKey = e.categoryId ?? "__none__";
    if (!groupMap.has(catKey)) {
      groupOrder.push(catKey);
      const cat = categories.find((c) => c.id === e.categoryId);
      groupMap.set(catKey, {
        categoryId: e.categoryId,
        name: cat?.name ?? "Sem categoria",
        subGroups: [],
      });
    }
    const group = groupMap.get(catKey)!;
    const subKey = e.subcategoryId ?? "__none__";
    let sub = group.subGroups.find((s) => (s.subcategoryId ?? "__none__") === subKey);
    if (!sub) {
      const cat = categories.find((c) => c.id === e.categoryId);
      const subcat = cat?.subcategories.find((s) => s.id === e.subcategoryId);
      sub = { subcategoryId: e.subcategoryId, name: subcat?.name, items: [] };
      group.subGroups.push(sub);
    }
    sub.items.push(e);
  }

  const categorized = groupOrder.filter((k) => k !== "__none__");
  const uncategorized = groupOrder.filter((k) => k === "__none__");

  return [...categorized, ...uncategorized].map((k) => {
    const group = groupMap.get(k)!;
    group.subGroups.sort((a, b) => {
      if (!a.subcategoryId) return -1;
      if (!b.subcategoryId) return 1;
      return 0;
    });
    return group;
  });
}

function FlatList({
  expenses,
  onDelete,
  onTogglePaid,
  onEdit,
}: {
  expenses: DisplayExpense[];
  onDelete?: (id: string) => void;
  onTogglePaid?: (id: string) => void;
  onEdit?: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {expenses.map((e) => (
        <li key={e.id}>
          <ExpenseCard expense={e} onDelete={onDelete} onTogglePaid={onTogglePaid} onEdit={onEdit} />
        </li>
      ))}
    </ul>
  );
}

export default function ExpenseList({
  expenses,
  categories,
  onDelete,
  onTogglePaid,
  onEdit,
  emptyMessage,
}: Props) {
  if (expenses.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-zinc-400">
        {emptyMessage ?? "Nenhuma despesa cadastrada ainda."}
      </p>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="mt-4">
        <FlatList expenses={expenses} onDelete={onDelete} onTogglePaid={onTogglePaid} onEdit={onEdit} />
      </div>
    );
  }

  const groups = buildGroups(expenses, categories);

  if (groups.length === 1 && !groups[0].categoryId) {
    return (
      <div className="mt-4">
        <FlatList expenses={expenses} onDelete={onDelete} onTogglePaid={onTogglePaid} onEdit={onEdit} />
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-5">
      {groups.map((group) => {
        const groupTotal = group.subGroups.reduce(
          (sum, sub) => sum + sub.items.reduce((s, e) => s + e.displayValue, 0),
          0
        );
        return (
        <div key={group.categoryId ?? "__none__"}>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {group.name}
            </span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {fmt(groupTotal)}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {group.subGroups.map((sub) => (
              <div key={sub.subcategoryId ?? "__none__"}>
                {sub.name && (
                  <p className="mb-1.5 pl-0.5 text-xs font-medium text-zinc-400">
                    {sub.name}
                  </p>
                )}
                <ul className="flex flex-col gap-2">
                  {sub.items.map((e) => (
                    <li key={e.id}>
                      <ExpenseCard
                        expense={{ ...e, categoryLabel: undefined }}
                        onDelete={onDelete}
                        onTogglePaid={onTogglePaid}
                        onEdit={onEdit}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        );
      })}
    </div>
  );
}
