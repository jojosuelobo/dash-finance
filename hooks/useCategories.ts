"use client";

import { useState, useEffect } from "react";
import type { Category } from "@/types/category";

// userId is kept in signature for call-site compatibility but auth is handled server-side
export function useCategories(_userId: string) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  async function addCategory(name: string) {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const category: Category = await res.json();
    setCategories((prev) => [...prev, category]);
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function addSubcategory(categoryId: string, name: string) {
    const res = await fetch(`/api/categories/${categoryId}/subcategories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const sub = await res.json();
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId ? { ...c, subcategories: [...c.subcategories, sub] } : c
      )
    );
  }

  async function deleteSubcategory(categoryId: string, subcategoryId: string) {
    await fetch(`/api/categories/${categoryId}/subcategories/${subcategoryId}`, {
      method: "DELETE",
    });
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subcategoryId) }
          : c
      )
    );
  }

  return { categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory };
}
