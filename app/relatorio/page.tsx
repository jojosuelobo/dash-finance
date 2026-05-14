"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { getDisplayExpenses } from "@/lib/expenseFilter";
import { useAuth } from "@/contexts/AuthContext";

const MONTHS = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

const CATEGORY_COLORS = [
  "#14b8a6", "#6366f1", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#84cc16", "#f97316",
];

function prevMonth(month: number, year: number) {
  return month === 0 ? { month: 11, year: year - 1 } : { month: month - 1, year };
}

function nextMonth(month: number, year: number) {
  return month === 11 ? { month: 0, year: year + 1 } : { month: month + 1, year };
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatYAxis(value: number): string {
  if (value === 0) return "0";
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return String(value);
}

export default function Relatorio() {
  const { user } = useAuth();
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const { expenses } = useExpenses(user!.userId);
  const { categories } = useCategories(user!.userId);

  const displayExpenses = getDisplayExpenses(expenses, categories, viewYear, viewMonth, now);

  const incomeItems = displayExpenses.filter((e) => e.kind === "income");
  const expenseItems = displayExpenses.filter((e) => e.kind !== "income");

  const totalIncome = incomeItems.reduce((sum, e) => sum + e.displayValue, 0);
  const totalExpenses = expenseItems.reduce((sum, e) => sum + e.displayValue, 0);
  const balance = totalIncome - totalExpenses;

  type SubGroup = { name: string; total: number };
  type CatGroup = { name: string; total: number; subcategories: Map<string, SubGroup> };
  const categoryGroups = new Map<string, CatGroup>();

  for (const e of expenseItems) {
    const cat = categories.find((c) => c.id === e.categoryId);
    const catKey = e.categoryId ?? "__none__";
    const catName = cat?.name ?? "Sem categoria";

    if (!categoryGroups.has(catKey)) {
      categoryGroups.set(catKey, { name: catName, total: 0, subcategories: new Map() });
    }

    const group = categoryGroups.get(catKey)!;
    group.total += e.displayValue;

    const sub = cat?.subcategories.find((s) => s.id === e.subcategoryId);
    const subKey = e.subcategoryId ?? `item:${e.id}`;
    const subName = sub?.name ?? e.name;

    if (!group.subcategories.has(subKey)) {
      group.subcategories.set(subKey, { name: subName, total: 0 });
    }
    group.subcategories.get(subKey)!.total += e.displayValue;
  }

  const categoryList = Array.from(categoryGroups.entries()).sort(
    (a, b) => b[1].total - a[1].total
  );

  const pieData = categoryList.map(([, g]) => ({ name: g.name, value: g.total }));

  const comparisonData = [
    { name: "Receitas", value: totalIncome },
    { name: "Despesas", value: totalExpenses },
  ];

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

  return (
    <>
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          aria-label="Mês anterior"
          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
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
          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Receitas
          </p>
          <p className="mt-1 text-xl font-bold text-teal-600 dark:text-teal-400">
            {formatBRL(totalIncome)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Despesas
          </p>
          <p className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">
            {formatBRL(totalExpenses)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Saldo
          </p>
          <p
            className={`mt-1 text-xl font-bold ${
              balance >= 0
                ? "text-teal-600 dark:text-teal-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatBRL(balance)}
          </p>
        </div>
      </div>

      {displayExpenses.length === 0 ? (
        <p className="mt-16 text-center text-zinc-400">
          Nenhuma movimentação registrada neste mês.
        </p>
      ) : (
        <>
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Receitas × Despesas
            </p>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={comparisonData} barSize={56} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip
                    formatter={(value) => [formatBRL(Number(value)), ""]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #3f3f46", background: "#18181b", fontSize: 13 }}
                    labelStyle={{ color: "#e4e4e7" }}
                    itemStyle={{ color: "#e4e4e7" }}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {comparisonData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#14b8a6" : "#f43f5e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {pieData.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Despesas por Categoria
              </p>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="44%"
                      outerRadius={100}
                      innerRadius={52}
                      paddingAngle={2}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatBRL(Number(value)), ""]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #3f3f46", background: "#18181b", fontSize: 13 }}
                      labelStyle={{ color: "#e4e4e7" }}
                      itemStyle={{ color: "#e4e4e7" }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 13, color: "#71717a" }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {categoryList.length > 0 && (
            <div className="mt-8 mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Detalhamento por Categoria
              </p>
              <div className="space-y-3">
                {categoryList.map(([key, group], i) => {
                  const subList = Array.from(group.subcategories.values()).sort(
                    (a, b) => b.total - a.total
                  );
                  const hasMultipleItems = subList.length > 1;

                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                          />
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            {group.name}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                            {formatBRL(group.total)}
                          </span>
                          {totalExpenses > 0 && (
                            <span className="text-xs text-zinc-400">
                              {((group.total / totalExpenses) * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {hasMultipleItems && (
                        <div className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                          {subList.map((sub) => (
                            <div key={sub.name} className="flex items-center justify-between text-sm">
                              <span className="text-zinc-500 dark:text-zinc-400">{sub.name}</span>
                              <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
                                {formatBRL(sub.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
