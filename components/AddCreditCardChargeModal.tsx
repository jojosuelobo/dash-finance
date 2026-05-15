"use client";

import { useState } from "react";
import type { CreditCard, CreditCardCategory, CreditCardCharge, CreditCardChargeType } from "@/types/creditCard";

interface Props {
  cards: CreditCard[];
  categories: CreditCardCategory[];
  initialCharge?: CreditCardCharge;
  onSave: (data: Omit<CreditCardCharge, "id" | "createdAt">) => void;
  onClose: () => void;
}

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
    <div className="flex gap-2">
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

const today = new Date().toISOString().split("T")[0];

export default function AddCreditCardChargeModal({ cards, categories, initialCharge, onSave, onClose }: Props) {
  const [type, setType] = useState<CreditCardChargeType>(initialCharge?.type ?? "assinatura");
  const [name, setName] = useState(initialCharge?.name ?? "");
  const [value, setValue] = useState(initialCharge?.value ? String(initialCharge.value).replace(".", ",") : "");
  const [cardId, setCardId] = useState(initialCharge?.cardId ?? (cards[0]?.id ?? ""));
  const [categoryId, setCategoryId] = useState(initialCharge?.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(initialCharge?.subcategoryId ?? "");
  const [startDate, setStartDate] = useState(initialCharge?.startDate ?? today);
  const [endDate, setEndDate] = useState(initialCharge?.endDate ?? "");
  const [installments, setInstallments] = useState(initialCharge?.installments ? String(initialCharge.installments) : "");
  const [startInstallment, setStartInstallment] = useState(initialCharge?.startInstallment ? String(initialCharge.startInstallment) : "1");
  const [active, setActive] = useState(initialCharge?.active ?? true);
  const [notes, setNotes] = useState(initialCharge?.notes ?? "");
  const [error, setError] = useState("");

  const selectedCat = categories.find((c) => c.id === categoryId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Nome é obrigatório."); return; }
    if (!cardId) { setError("Selecione um cartão."); return; }
    const parsedValue = parseFloat(value.replace(",", "."));
    if (isNaN(parsedValue) || parsedValue <= 0) { setError("Informe um valor válido."); return; }
    if (!startDate) { setError("Informe a data de início."); return; }

    const parsedInstallments = type === "parcelado" ? parseInt(installments) : undefined;
    const parsedStartInstallment = type === "parcelado" ? parseInt(startInstallment) : undefined;
    if (type === "parcelado") {
      const selectedCard = cards.find((c) => c.id === cardId);
      if (!selectedCard?.dueDay) {
        setError("Este cartão não tem dia de vencimento. Cadastre o vencimento no cartão antes de adicionar parcelamentos.");
        return;
      }
      if (!parsedInstallments || parsedInstallments < 1) { setError("Informe o número de parcelas."); return; }
      if (!parsedStartInstallment || parsedStartInstallment < 1) { setError("Informe a parcela de início."); return; }
      if (parsedStartInstallment > parsedInstallments) { setError("Parcela de início não pode ser maior que o total."); return; }
    }

    onSave({
      cardId,
      name: name.trim(),
      value: parsedValue,
      type,
      installments: parsedInstallments,
      startInstallment: parsedStartInstallment,
      startDate,
      endDate: (type === "assinatura" && endDate) ? endDate : undefined,
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      notes: notes.trim() || undefined,
      active: type === "assinatura" ? active : true,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex w-full max-w-sm flex-col rounded-xl bg-white shadow-xl dark:bg-zinc-900" style={{ maxHeight: "92vh" }}>
        <div className="overflow-y-auto px-6 py-6">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {initialCharge ? "Editar cobrança" : "Nova cobrança"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Tipo */}
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Tipo</label>
              <ToggleGroup
                options={[
                  { value: "assinatura", label: "Assinatura" },
                  { value: "parcelado", label: "Parcelado" },
                  { value: "avulso", label: "Avulso" },
                ]}
                value={type}
                onChange={(v) => setType(v as CreditCardChargeType)}
              />
            </div>

            {/* Nome */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Nome</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === "assinatura" ? "Ex: Netflix" : type === "parcelado" ? "Ex: iPhone 15" : "Ex: Compra na loja"}
                className={inputClass}
              />
            </div>

            {/* Valor */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {type === "parcelado" ? "Valor total (R$)" : "Valor (R$)"}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
                className={inputClass}
              />
              {type === "parcelado" && installments && !isNaN(parseFloat(value.replace(",", "."))) && parseInt(installments) > 0 && (
                <p className="mt-1 text-xs text-zinc-400">
                  {(parseFloat(value.replace(",", ".")) / parseInt(installments)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / parcela
                </p>
              )}
            </div>

            {/* Cartão */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Cartão</label>
              {cards.length === 0 ? (
                <p className="text-xs text-zinc-400">Nenhum cartão cadastrado.</p>
              ) : (
                <select value={cardId} onChange={(e) => setCardId(e.target.value)} className={inputClass}>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.bank}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Parcelas (parcelado) */}
            {type === "parcelado" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Total de parcelas</label>
                  <input
                    type="number"
                    min={1}
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    placeholder="12"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Parcela de início</label>
                  <input
                    type="number"
                    min={1}
                    value={startInstallment}
                    onChange={(e) => setStartInstallment(e.target.value)}
                    placeholder="1"
                    className={inputClass}
                  />
                </div>
                <p className="col-span-2 -mt-1 text-xs text-zinc-400">
                  A partir daí, o progresso avança automaticamente a cada vencimento.
                </p>
              </div>
            )}

            {/* Categoria */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Categoria <span className="text-zinc-400">(opcional)</span></label>
              <select
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(""); }}
                className={inputClass}
              >
                <option value="">— Sem categoria —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {selectedCat && selectedCat.subcategories.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Subcategoria <span className="text-zinc-400">(opcional)</span></label>
                <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} className={inputClass}>
                  <option value="">— Sem subcategoria —</option>
                  {selectedCat.subcategories.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Data início */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {type === "parcelado" ? "Data da compra" : "Data de início"}
              </label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>

            {/* Data fim (assinatura) */}
            {type === "assinatura" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Data de encerramento <span className="text-zinc-400">(opcional)</span>
                </label>
                <input
                  type="month"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            {/* Ativo (assinatura) */}
            {type === "assinatura" && (
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Assinatura ativa</span>
                <button
                  type="button"
                  onClick={() => setActive((p) => !p)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${active ? "bg-zinc-900 dark:bg-zinc-50" : "bg-zinc-200 dark:bg-zinc-700"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform dark:bg-zinc-900 ${active ? "translate-x-4" : "translate-x-1"}`} />
                </button>
              </div>
            )}

            {/* Notas */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Notas <span className="text-zinc-400">(opcional)</span></label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observação..."
                className={inputClass}
              />
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
                {initialCharge ? "Salvar" : "Adicionar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
