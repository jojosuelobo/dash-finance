"use client";

import { useState, useEffect } from "react";
import type { Category } from "@/types/category";

const STORAGE_KEY = "dash-finance-categories";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCategories(JSON.parse(stored));
    } catch {
      // ignore malformed storage
    }
  }, []);

  function persist(next: Category[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setCategories(next);
  }

  function addCategory(name: string) {
    persist([...categories, { id: crypto.randomUUID(), name: name.trim(), subcategories: [] }]);
  }

  function deleteCategory(id: string) {
    persist(categories.filter((c) => c.id !== id));
  }

  function addSubcategory(categoryId: string, name: string) {
    persist(
      categories.map((c) =>
        c.id === categoryId
          ? { ...c, subcategories: [...c.subcategories, { id: crypto.randomUUID(), name: name.trim() }] }
          : c
      )
    );
  }

  function deleteSubcategory(categoryId: string, subcategoryId: string) {
    persist(
      categories.map((c) =>
        c.id === categoryId
          ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subcategoryId) }
          : c
      )
    );
  }

  return { categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory };
}
