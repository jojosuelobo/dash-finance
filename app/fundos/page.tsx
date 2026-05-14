"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ScatterChart, Scatter,
  ZAxis, Cell,
} from "recharts";
import { useContributions } from "@/hooks/useContributions";
import AddContributionModal from "@/components/AddContributionModal";
import type { ContributionType } from "@/types/contribution";
import { useAuth } from "@/contexts/AuthContext";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatYAxis(v: number) {
  if (v === 0) return "0";
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return String(v);
}

function formatMonth(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-");
  const labels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${labels[parseInt(m) - 1]}/${y.slice(2)}`;
}

function formatDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-");
  return `${d}/${m}/${y}`;
}

// ── constants ─────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<ContributionType, string> = {
  cripto: "Cripto",
  investimento: "Investimento",
};

const SUBTYPE_LABEL: Record<string, string> = {
  bitcoin: "Bitcoin",
  etc: "ETC",
  outros: "Outros",
};

// Bubble config — one entry per tracked bucket
const BUBBLE_CFG: {
  key: string;
  label: string;
  color: string;
  x: number;
}[] = [
  { key: "investimento",  label: "Investimento", color: "#6366f1", x: 1 },
  { key: "cripto-bitcoin", label: "Bitcoin",     color: "#f59e0b", x: 3 },
  { key: "cripto-etc",     label: "ETC",         color: "#f97316", x: 4 },
  { key: "cripto-outros",  label: "Outros (C)",  color: "#fbbf24", x: 5 },
];

// ── custom tooltip para bubble chart ─────────────────────────────────────────

function BubbleTooltip({ active, payload }: { active?: boolean; payload?: { payload: { label: string; z: number } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-zinc-100">{d.label}</p>
      <p className="text-zinc-400">{formatBRL(d.z)}</p>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function Fundos() {
  const { user } = useAuth();
  const { contributions, addContribution, deleteContribution } = useContributions(user!.userId);
  const [addOpen, setAddOpen] = useState(false);

  // ── totals ──────────────────────────────────────────────────────────────────
  const totalAported    = contributions.filter(c => c.kind === "aporte").reduce((s, c) => s + c.value, 0);
  const totalWithdrawn  = contributions.filter(c => c.kind === "retirada").reduce((s, c) => s + c.value, 0);
  const currentBalance  = totalAported - totalWithdrawn;

  // ── evolution chart data ─────────────────────────────────────────────────────
  const monthMap = new Map<string, { cripto: number; investimento: number; retirada: number }>();
  for (const c of contributions) {
    const mk = c.date.substring(0, 7);
    if (!monthMap.has(mk)) monthMap.set(mk, { cripto: 0, investimento: 0, retirada: 0 });
    const m = monthMap.get(mk)!;
    if (c.kind === "aporte") {
      m[c.type] += c.value;
    } else {
      m.retirada -= c.value;
    }
  }
  const evolutionData = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mk, v]) => ({ month: formatMonth(mk), ...v }));

  // ── bubble chart data ────────────────────────────────────────────────────────
  const netBalance = new Map<string, number>();
  for (const c of contributions) {
    const key = c.type === "cripto" && c.subtype
      ? `cripto-${c.subtype}`
      : c.type;
    netBalance.set(key, (netBalance.get(key) ?? 0) + (c.kind === "aporte" ? c.value : -c.value));
  }

  const bubbleData = BUBBLE_CFG.map(cfg => ({
    ...cfg,
    y: 1,
    z: Math.max(0, netBalance.get(cfg.key) ?? 0),
  })).filter(b => b.z > 0);

  const hasBubbles = bubbleData.length > 0;

  // ── sorted list ──────────────────────────────────────────────────────────────
  const sorted = [...contributions].sort((a, b) => b.date.localeCompare(a.date));

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Fundos
        </h1>
        <button
          onClick={() => setAddOpen(true)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          ADICIONAR
        </button>
      </div>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className={`rounded-xl border p-4 ${
          currentBalance >= 0
            ? "border-green-100 bg-green-50 dark:border-green-900/40 dark:bg-green-950/30"
            : "border-red-100 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30"
        }`}>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Saldo Atual</p>
          <p className={`mt-1 text-xl font-bold ${
            currentBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}>
            {formatBRL(currentBalance)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Total Aportado</p>
          <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{formatBRL(totalAported)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Total Retirado</p>
          <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{formatBRL(totalWithdrawn)}</p>
        </div>
      </div>

      {contributions.length === 0 ? (
        <p className="mt-16 text-center text-zinc-400">Nenhuma movimentação registrada.</p>
      ) : (
        <>
          {/* Evolution chart */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Evolução dos Aportes
            </p>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={evolutionData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip
                    formatter={(v, name) => [formatBRL(Number(v)), name === "retirada" ? "Retirada" : TYPE_LABEL[name as ContributionType]]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #3f3f46", background: "#18181b", fontSize: 13 }}
                    labelStyle={{ color: "#e4e4e7" }}
                    itemStyle={{ color: "#e4e4e7" }}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Legend
                    iconType="square"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: 13, color: "#71717a" }}>
                        {value === "retirada" ? "Retirada" : TYPE_LABEL[value as ContributionType]}
                      </span>
                    )}
                  />
                  <Bar dataKey="investimento" name="investimento" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="cripto"       name="cripto"       stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="retirada"     name="retirada"     fill="#f43f5e" radius={[0, 0, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bubble chart */}
          {hasBubbles && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Distribuição por Tipo
              </p>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
                    <XAxis type="number" dataKey="x" domain={[0, 6]} hide />
                    <YAxis type="number" dataKey="y" domain={[0, 2]} hide />
                    <ZAxis type="number" dataKey="z" range={[300, 2500]} />
                    <Tooltip content={<BubbleTooltip />} />
                    {bubbleData.map((b) => (
                      <Scatter key={b.key} name={b.label} data={[b]} fill={b.color} fillOpacity={0.85}>
                        <Cell fill={b.color} />
                      </Scatter>
                    ))}
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 12, color: "#71717a" }}>{value}</span>
                      )}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Contributions list */}
          <div className="mt-8 mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Movimentações
            </p>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Operação</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Subtipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Qtd / Cotação</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">Valor</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`${i !== 0 ? "border-t border-zinc-100 dark:border-zinc-800" : ""}`}
                    >
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {formatDate(c.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${
                          c.kind === "aporte"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-500 dark:text-red-400"
                        }`}>
                          {c.kind === "aporte" ? "Aporte" : "Retirada"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {TYPE_LABEL[c.type]}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {c.subtype ? SUBTYPE_LABEL[c.subtype] : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 tabular-nums text-xs">
                        {c.type === "cripto" && (c.quantidade || c.cotacao) ? (
                          <span>
                            {c.quantidade != null ? c.quantidade.toLocaleString("pt-BR") : "—"}
                            {" / "}
                            {c.cotacao != null ? formatBRL(c.cotacao) : "—"}
                          </span>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600">—</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        c.kind === "aporte"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-500 dark:text-red-400"
                      }`}>
                        {c.kind === "retirada" && "−"}{formatBRL(c.value)}
                      </td>
                      <td className="px-2 py-3">
                        <button
                          onClick={() => deleteContribution(c.id)}
                          aria-label="Excluir"
                          className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {addOpen && (
        <AddContributionModal
          onAdd={addContribution}
          onClose={() => setAddOpen(false)}
        />
      )}
    </>
  );
}
