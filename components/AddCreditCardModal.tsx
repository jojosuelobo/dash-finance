"use client";

import { useState } from "react";
import type { CreditCard } from "@/types/creditCard";

interface Props {
  onAdd: (data: Omit<CreditCard, "id" | "createdAt">) => void;
  onClose: () => void;
}

const COLORS = [
  { value: "#6366f1", label: "Roxo" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#22c55e", label: "Verde" },
  { value: "#f97316", label: "Laranja" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#eab308", label: "Amarelo" },
  { value: "#71717a", label: "Cinza" },
];

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-500";

export default function AddCreditCardModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [color, setColor] = useState(COLORS[0].value);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Nome é obrigatório."); return; }
    if (!bank.trim()) { setError("Banco é obrigatório."); return; }

    const closing = closingDay ? parseInt(closingDay) : undefined;
    const due = dueDay ? parseInt(dueDay) : undefined;

    if (closing && (closing < 1 || closing > 31)) { setError("Dia de fechamento inválido."); return; }
    if (due && (due < 1 || due > 31)) { setError("Dia de vencimento inválido."); return; }

    onAdd({ name: name.trim(), bank: bank.trim(), closingDay: closing, dueDay: due, color });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex w-full max-w-sm flex-col rounded-xl bg-white shadow-xl dark:bg-zinc-900">
        <div className="overflow-y-auto px-6 py-6">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Novo cartão
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Nome do cartão</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Nubank Roxinho"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Banco</label>
              <input
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="Ex: Nubank"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Fechamento <span className="text-zinc-400">(dia)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={closingDay}
                  onChange={(e) => setClosingDay(e.target.value)}
                  placeholder="Ex: 20"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Vencimento <span className="text-zinc-400">(dia)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  placeholder="Ex: 27"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Cor</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`h-7 w-7 rounded-full transition-all ${
                      color === c.value ? "ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-900" : ""
                    }`}
                    style={{ backgroundColor: c.value }}
                    aria-label={c.label}
                  />
                ))}
              </div>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="mt-1 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
