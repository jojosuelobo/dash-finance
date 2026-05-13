"use client";

import { useRef, useState } from "react";
import type { Attachment, Expense } from "@/types/expense";
import type { Category } from "@/types/category";

interface Props {
  onAdd: (data: Omit<Expense, "id" | "createdAt">) => void;
  onClose: () => void;
  categories: Category[];
  initialExpense?: Expense;
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

export default function AddExpenseModal({ onAdd, onClose, categories, initialExpense }: Props) {
  const isEdit = !!initialExpense;

  const [kind, setKind] = useState<"expense" | "income">(
    initialExpense?.kind === "income" ? "income" : "expense"
  );

  // Expense-specific
  const [type, setType] = useState<"one-time" | "fixed">(
    initialExpense?.kind !== "income" ? (initialExpense?.type ?? "one-time") : "one-time"
  );
  const [fixedMode, setFixedMode] = useState<"unlimited" | "installments">(
    initialExpense?.fixedMode ?? "unlimited"
  );
  const [installments, setInstallments] = useState(
    initialExpense?.installments?.toString() ?? ""
  );

  // Income-specific
  const [incomeType, setIncomeType] = useState<"one-time" | "monthly">(
    initialExpense?.kind === "income" && initialExpense?.type === "fixed" ? "monthly" : "one-time"
  );

  // Shared
  const [name, setName] = useState(initialExpense?.name ?? "");
  const [value, setValue] = useState(
    initialExpense ? initialExpense.value.toFixed(2).replace(".", ",") : ""
  );
  const [dueDate, setDueDate] = useState(initialExpense?.dueDate ?? today);
  const [categoryId, setCategoryId] = useState(initialExpense?.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(initialExpense?.subcategoryId ?? "");
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [notes, setNotes] = useState(initialExpense?.notes ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>(
    initialExpense?.attachments ?? []
  );
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isInstallments = kind === "expense" && type === "fixed" && fixedMode === "installments";
  const isIncome = kind === "income";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          { id: crypto.randomUUID(), name: file.name, type: file.type, data: reader.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  function handleKindChange(k: string) {
    setKind(k as "expense" | "income");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = parseFloat(value.replace(",", "."));
    if (!name.trim()) { setError("Informe o nome."); return; }
    if (isNaN(parsed) || parsed <= 0) { setError("Informe um valor válido."); return; }
    if (isInstallments) {
      const count = parseInt(installments);
      if (!count || count < 2) { setError("Informe ao menos 2 parcelas."); return; }
    }

    const sharedFields = {
      dueDate: dueDate || undefined,
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      notes: notes.trim() || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    if (isIncome) {
      onAdd({
        kind: "income",
        name: name.trim(),
        value: parsed,
        type: incomeType === "monthly" ? "fixed" : "one-time",
        fixedMode: incomeType === "monthly" ? "unlimited" : undefined,
        paidMonths: alreadyDone && dueDate ? [dueDate.substring(0, 7)] : undefined,
        ...sharedFields,
      });
    } else {
      onAdd({
        kind: "expense",
        name: name.trim(),
        value: parsed,
        type,
        fixedMode: type === "fixed" ? fixedMode : undefined,
        installments: isInstallments ? parseInt(installments) : undefined,
        paidMonths: alreadyDone && dueDate ? [dueDate.substring(0, 7)] : undefined,
        ...sharedFields,
      });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex w-full max-w-sm flex-col rounded-xl bg-white shadow-xl dark:bg-zinc-900" style={{ maxHeight: "90vh" }}>
        <div className="overflow-y-auto px-6 py-6">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {isEdit
              ? isIncome ? "Editar receita" : "Editar despesa"
              : isIncome ? "Nova receita" : "Nova despesa"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Kind toggle */}
            <ToggleGroup
              options={[
                { value: "expense", label: "Despesa" },
                { value: "income", label: "Receita" },
              ]}
              value={kind}
              onChange={handleKindChange}
            />

            {/* Nome */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isIncome ? "Ex: Salário" : "Ex: Aluguel"}
                className={inputClass}
              />
            </div>

            {/* Valor */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {isInstallments ? "Valor total (R$)" : "Valor (R$)"}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
                className={inputClass}
              />
              {isInstallments && installments && parseFloat(value.replace(",", ".")) > 0 && (
                <p className="mt-1 text-xs text-zinc-400">
                  {parseInt(installments)}x de R${" "}
                  {(parseFloat(value.replace(",", ".")) / parseInt(installments)).toFixed(2).replace(".", ",")}
                </p>
              )}
            </div>

            {/* Due / receive date */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {isIncome ? "Recebimento" : "Vencimento"}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Tipo — expense */}
            {!isIncome && (
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Tipo</label>
                <ToggleGroup
                  options={[{ value: "one-time", label: "Avulsa" }, { value: "fixed", label: "Fixa" }]}
                  value={type}
                  onChange={(v) => setType(v as "one-time" | "fixed")}
                />
              </div>
            )}

            {/* Fixed sub-options — expense */}
            {!isIncome && type === "fixed" && (
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Recorrência</label>
                <ToggleGroup
                  options={[{ value: "unlimited", label: "Ilimitada" }, { value: "installments", label: "Parcelada" }]}
                  value={fixedMode}
                  onChange={(v) => setFixedMode(v as "unlimited" | "installments")}
                />
                {fixedMode === "installments" && (
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Número de parcelas</label>
                    <input
                      type="number"
                      min={2}
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      placeholder="Ex: 10"
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tipo — income */}
            {isIncome && (
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Tipo</label>
                <ToggleGroup
                  options={[{ value: "one-time", label: "Único" }, { value: "monthly", label: "Mensal" }]}
                  value={incomeType}
                  onChange={(v) => setIncomeType(v as "one-time" | "monthly")}
                />
              </div>
            )}

            {/* Categoria */}
            {categories.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Categoria</label>
                <select
                  value={categoryId}
                  onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(""); }}
                  className={inputClass}
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedCategory && selectedCategory.subcategories.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Subcategoria</label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sem subcategoria</option>
                  {selectedCategory.subcategories.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Observações */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Anexos */}
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Anexos
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 py-2 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Adicionar arquivo
              </button>
              {attachments.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {attachments.map((att) => (
                    <li
                      key={att.id}
                      className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-zinc-400">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                      <span className="flex-1 truncate text-xs text-zinc-600 dark:text-zinc-300">
                        {att.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        aria-label="Remover anexo"
                        className="flex-shrink-0 rounded p-0.5 text-zinc-400 transition-colors hover:text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Already paid/received — only on creation */}
            {!isEdit && (
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={alreadyDone}
                  onChange={(e) => setAlreadyDone(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-green-600"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {isIncome ? "Já recebi" : "Já está paga"}
                </span>
              </label>
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
                {isEdit ? "Salvar alterações" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
