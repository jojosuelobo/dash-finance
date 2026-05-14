"use client";

import { useState } from "react";
import type { Category } from "@/types/category";

interface Props {
  categories: Category[];
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
  onAddSubcategory: (categoryId: string, name: string) => void;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => void;
  onClose: () => void;
}

export default function ManageCategoriesModal({
  categories,
  onAddCategory,
  onDeleteCategory,
  onAddSubcategory,
  onDeleteSubcategory,
  onClose,
}: Props) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");

  function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    onAddCategory(newCategoryName);
    setNewCategoryName("");
    setShowAddCategory(false);
  }

  function handleAddSubcategory(categoryId: string) {
    if (!newSubName.trim()) return;
    onAddSubcategory(categoryId, newSubName);
    setNewSubName("");
    setAddingSubFor(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex w-full max-w-sm flex-col rounded-xl bg-white shadow-xl dark:bg-zinc-900" style={{ maxHeight: "85vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Categorias</h2>
          <button
            onClick={() => { setShowAddCategory(true); setNewCategoryName(""); }}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Nova categoria
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Add category form */}
          {showAddCategory && (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                placeholder="Nome da categoria"
                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
              <button
                onClick={handleAddCategory}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
              >
                Salvar
              </button>
              <button
                onClick={() => setShowAddCategory(false)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-500 hover:border-zinc-400 dark:border-zinc-700"
              >
                ×
              </button>
            </div>
          )}

          {categories.length === 0 && !showAddCategory && (
            <p className="py-4 text-center text-sm text-zinc-400">Nenhuma categoria ainda.</p>
          )}

          {/* Category list */}
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
              {/* Category header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{cat.name}</span>
                <button
                  onClick={() => onDeleteCategory(cat.id)}
                  aria-label="Deletar categoria"
                  className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" /><path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>

              {/* Subcategories */}
              {cat.subcategories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cat.subcategories.map((sub) => (
                    <span key={sub.id} className="flex items-center gap-1 rounded-full bg-white border border-zinc-200 pl-2.5 pr-1 py-0.5 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                      {sub.name}
                      <button
                        onClick={() => onDeleteSubcategory(cat.id, sub.id)}
                        aria-label="Deletar subcategoria"
                        className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/40"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add subcategory */}
              {addingSubFor === cat.id ? (
                <div className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubcategory(cat.id)}
                    placeholder="Nome da subcategoria"
                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                  <button
                    onClick={() => handleAddSubcategory(cat.id)}
                    className="rounded-lg bg-zinc-900 px-2.5 py-2 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setAddingSubFor(null)}
                    className="rounded-lg border border-zinc-200 px-2 py-2 text-xs text-zinc-500 hover:border-zinc-400 dark:border-zinc-700"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setAddingSubFor(cat.id); setNewSubName(""); }}
                  className="mt-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  + Subcategoria
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
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
  );
}
