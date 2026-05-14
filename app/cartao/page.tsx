"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useCreditCardCategories } from "@/hooks/useCreditCardCategories";
import { useCreditCardCharges } from "@/hooks/useCreditCardCharges";
import AddCreditCardModal from "@/components/AddCreditCardModal";
import AddCreditCardChargeModal from "@/components/AddCreditCardChargeModal";
import ManageCreditCardCategoriesModal from "@/components/ManageCreditCardCategoriesModal";
import type { CreditCard, CreditCardCharge } from "@/types/creditCard";
import { computeInstallmentStatus } from "@/lib/creditCardFilter";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-");
  return `${d}/${m}/${y}`;
}

function monthlyValue(charge: CreditCardCharge): number {
  if (charge.type === "parcelado") return charge.value / (charge.installments ?? 1);
  return charge.value;
}

function installmentStatus(charge: CreditCardCharge, card?: CreditCard) {
  if (charge.type !== "parcelado" || !charge.installments || !card?.dueDay) {
    return { currentInstallment: 1, isDone: false };
  }
  return computeInstallmentStatus(
    charge.startDate,
    charge.installments,
    card.dueDay,
    card.closingDay
  );
}

function isEffectivelyActive(charge: CreditCardCharge, card?: CreditCard): boolean {
  if (charge.type === "assinatura") return charge.active;
  if (charge.type === "parcelado") return !installmentStatus(charge, card).isDone;
  return true;
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// ── ManageCardsModal ──────────────────────────────────────────────────────────

function ManageCardsModal({
  cards,
  onAddCard,
  onDeleteCard,
  onClose,
}: {
  cards: CreditCard[];
  onAddCard: (data: Omit<CreditCard, "id" | "createdAt">) => void;
  onDeleteCard: (id: string) => void;
  onClose: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="flex w-full max-w-sm flex-col rounded-xl bg-white shadow-xl dark:bg-zinc-900" style={{ maxHeight: "85vh" }}>
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Meus Cartões</h2>
            <button
              onClick={() => setAddOpen(true)}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              + Novo cartão
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {cards.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400">Nenhum cartão cadastrado.</p>
            ) : (
              cards.map((card) => (
                <div key={card.id} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: card.color ?? "#71717a" }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{card.name}</p>
                    <p className="text-xs text-zinc-400">
                      {card.bank}
                      {card.closingDay ? ` · Fecha dia ${card.closingDay}` : ""}
                      {card.dueDay ? ` · Vence dia ${card.dueDay}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteCard(card.id)}
                    aria-label="Excluir cartão"
                    className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <button
              onClick={onClose}
              className="w-full rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {addOpen && (
        <AddCreditCardModal
          onAdd={(data) => { onAddCard(data); setAddOpen(false); }}
          onClose={() => setAddOpen(false)}
        />
      )}
    </>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function CartaoPage() {
  const { user } = useAuth();
  const { cards, addCard, deleteCard } = useCreditCards();
  const { categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory } = useCreditCardCategories();
  const { charges, addCharge, updateCharge, deleteCharge } = useCreditCardCharges();

  const [selectedCardId, setSelectedCardId] = useState<string>("all");
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [editCharge, setEditCharge] = useState<CreditCardCharge | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [manageCardsOpen, setManageCardsOpen] = useState(false);

  if (!user) return null;

  // ── filtering ─────────────────────────────────────────────────────────────
  const filtered = useMemo(
    () => selectedCardId === "all" ? charges : charges.filter((c) => c.cardId === selectedCardId),
    [charges, selectedCardId]
  );

  const subscriptions = filtered.filter((c) => c.type === "assinatura");
  const installments  = filtered.filter((c) => c.type === "parcelado");
  const oneTime       = filtered.filter((c) => c.type === "avulso");

  const monthlyTotal = useMemo(
    () => filtered.filter((c) => isEffectivelyActive(c, cards.find((card) => card.id === c.cardId))).reduce((sum, c) => sum + monthlyValue(c), 0),
    [filtered, cards]
  );
  const activeSubscriptions = subscriptions.filter((c) => c.active).length;
  const activeInstallments  = installments.filter((c) => !installmentStatus(c, cards.find((card) => card.id === c.cardId)).isDone).length;

  function categoryLabel(charge: CreditCardCharge): string {
    if (!charge.categoryId) return "";
    const cat = categories.find((c) => c.id === charge.categoryId);
    if (!cat) return "";
    if (charge.subcategoryId) {
      const sub = cat.subcategories.find((s) => s.id === charge.subcategoryId);
      return sub ? `${cat.name} › ${sub.name}` : cat.name;
    }
    return cat.name;
  }

  // ── charge row ────────────────────────────────────────────────────────────
  function ChargeRow({ charge }: { charge: CreditCardCharge }) {
    const card = cards.find((c) => c.id === charge.cardId);
    const catLabel = categoryLabel(charge);
    const { currentInstallment, isDone } = installmentStatus(charge, card);
    const active = isEffectivelyActive(charge, card);
    const monthly = monthlyValue(charge);

    return (
      <div className={`flex items-center gap-3 px-4 py-3 border-b border-zinc-100 last:border-0 dark:border-zinc-800 ${!active ? "opacity-50" : ""}`}>
        <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: card?.color ?? "#71717a" }} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{charge.name}</span>
            {charge.type === "assinatura" && (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${charge.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                {charge.active ? "ativa" : "inativa"}
              </span>
            )}
            {charge.type === "parcelado" && (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${isDone ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                {currentInstallment}/{charge.installments ?? 1}{isDone ? " — quitado" : ""}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-400">
            {card && <span>{card.name}</span>}
            {catLabel && <span>· {catLabel}</span>}
            <span>· {formatDate(charge.startDate)}</span>
            {charge.notes && <span>· {charge.notes}</span>}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
            {formatBRL(monthly)}
          </div>
          {charge.type === "parcelado" ? (
            <div className="text-xs text-zinc-400 tabular-nums">total {formatBRL(charge.value)}</div>
          ) : (
            <div className="text-xs text-zinc-400">/mês</div>
          )}
        </div>

        <div className="shrink-0 flex gap-1">
          <button
            onClick={() => setEditCharge(charge)}
            aria-label="Editar"
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => deleteCharge(charge.id)}
            aria-label="Excluir"
            className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    );
  }

  function Section({ title, items, emptyText }: { title: string; items: CreditCardCharge[]; emptyText: string }) {
    return (
      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</p>
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-400">{emptyText}</p>
          ) : (
            items.map((c) => <ChargeRow key={c.id} charge={c} />)
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Cartão de Crédito
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setCategoriesOpen(true)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 transition-colors"
          >
            Categorias
          </button>
          <button
            onClick={() => setManageCardsOpen(true)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 transition-colors"
          >
            Cartões
          </button>
          <button
            onClick={() => setAddChargeOpen(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Adicionar
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Total Mensal</p>
          <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{formatBRL(monthlyTotal)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Assinaturas Ativas</p>
          <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{activeSubscriptions}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Parcelamentos Ativos</p>
          <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{activeInstallments}</p>
        </div>
      </div>

      {/* Card filter tabs */}
      {cards.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCardId("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCardId === "all"
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "border border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            Todos
          </button>
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCardId === card.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "border border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: card.color ?? "#71717a" }} />
              {card.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {charges.length === 0 ? (
        <p className="mt-16 text-center text-zinc-400">
          {cards.length === 0
            ? 'Adicione um cartão clicando em "Cartões" para começar.'
            : "Nenhuma cobrança registrada ainda."}
        </p>
      ) : (
        <div className="mb-10">
          <Section title="Assinaturas" items={subscriptions} emptyText="Nenhuma assinatura." />
          <Section title="Parcelamentos" items={installments} emptyText="Nenhum parcelamento." />
          {oneTime.length > 0 && (
            <Section title="Avulsos" items={oneTime} emptyText="" />
          )}
        </div>
      )}

      {/* Modals */}
      {(addChargeOpen || editCharge) && (
        <AddCreditCardChargeModal
          cards={cards}
          categories={categories}
          initialCharge={editCharge ?? undefined}
          onSave={editCharge
            ? (data) => updateCharge(editCharge.id, data)
            : addCharge}
          onClose={() => { setAddChargeOpen(false); setEditCharge(null); }}
        />
      )}

      {categoriesOpen && (
        <ManageCreditCardCategoriesModal
          categories={categories}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
          onAddSubcategory={addSubcategory}
          onDeleteSubcategory={deleteSubcategory}
          onClose={() => setCategoriesOpen(false)}
        />
      )}

      {manageCardsOpen && (
        <ManageCardsModal
          cards={cards}
          onAddCard={addCard}
          onDeleteCard={deleteCard}
          onClose={() => setManageCardsOpen(false)}
        />
      )}
    </>
  );
}
