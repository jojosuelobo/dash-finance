"use client";

import { useState } from "react";
import type { Contribution, ContributionKind, ContributionType, ContributionSubtype } from "@/types/contribution";

interface Props {
  onAdd: (data: Omit<Contribution, "id" | "createdAt">) => void;
  onClose: () => void;
}

const today = new Date().toISOString().split("T")[0];

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-500";

function ToggleGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-3">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            value === o.value
              ? "flex-1 rounded-lg border-2 border-zinc-900 bg-zinc-900 py-2 text-xs font-semibold text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              : "flex-1 rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const CRIPTO_SUBTYPES = [
  { value: "bitcoin", label: "Bitcoin" },
  { value: "etc",     label: "ETC"     },
  { value: "outros",  label: "Outros"  },
];

export default function AddContributionModal({ onAdd, onClose }: Props) {
  const [kind,       setKind]       = useState<ContributionKind>("aporte");
  const [date,       setDate]       = useState(today);
  const [value,      setValue]      = useState("");
  const [type,       setType]       = useState<ContributionType>("investimento");
  const [subtype,    setSubtype]    = useState<ContributionSubtype>("bitcoin");
  const [quantidade, setQuantidade] = useState("");
  const [cotacao,    setCotacao]    = useState("");
  const [error,      setError]      = useState("");

  function handleTypeChange(t: string) {
    setType(t as ContributionType);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = parseFloat(value.replace(",", "."));
    if (!date) { setError("Informe a data."); return; }
    if (isNaN(parsed) || parsed <= 0) { setError("Informe um valor válido."); return; }

    const data: Omit<Contribution, "id" | "createdAt"> = {
      kind, date, value: parsed, type,
    };

    if (type === "cripto") {
      data.subtype = subtype;
      const q = parseFloat(quantidade.replace(",", "."));
      if (!isNaN(q) && q > 0) data.quantidade = q;
      const c = parseFloat(cotacao.replace(",", "."));
      if (!isNaN(c) && c > 0) data.cotacao = c;
    }

    onAdd(data);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex w-full max-w-sm flex-col rounded-xl bg-white shadow-xl dark:bg-zinc-900" style={{ maxHeight: "90vh" }}>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Nova movimentação
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Operação */}
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Operação</label>
              <ToggleGroup
                options={[
                  { value: "aporte",   label: "Aporte"   },
                  { value: "retirada", label: "Retirada" },
                ]}
                value={kind}
                onChange={(v) => setKind(v as ContributionKind)}
              />
            </div>

            {/* Data */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Valor */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Valor (R$)</label>
                {type === "cripto" && (
                  <button
                    type="button"
                    onClick={() => {
                      const q = parseFloat(quantidade.replace(",", "."));
                      const c = parseFloat(cotacao.replace(",", "."));
                      if (!isNaN(q) && !isNaN(c) && q > 0 && c > 0) {
                        setValue((q * c).toFixed(2).replace(".", ","));
                      }
                    }}
                    className="rounded px-2 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    Calcular (qtd × cotação)
                  </button>
                )}
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
                className={inputClass}
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Tipo</label>
              <ToggleGroup
                options={[
                  { value: "investimento", label: "Investimento" },
                  { value: "cripto",       label: "Cripto"       },
                ]}
                value={type}
                onChange={handleTypeChange}
              />
            </div>

            {/* Subtipo + campos cripto */}
            {type === "cripto" && (
              <>
                <div>
                  <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Subtipo</label>
                  <ToggleGroup
                    options={CRIPTO_SUBTYPES}
                    value={subtype}
                    onChange={(v) => setSubtype(v as ContributionSubtype)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Quantidade <span className="text-zinc-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    placeholder="0,00000000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Cotação (R$) <span className="text-zinc-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cotacao}
                    onChange={(e) => setCotacao(e.target.value)}
                    placeholder="0,00"
                    className={inputClass}
                  />
                </div>
              </>
            )}

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
                {kind === "aporte" ? "Registrar aporte" : "Registrar retirada"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
