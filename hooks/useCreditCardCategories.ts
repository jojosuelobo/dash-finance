"use client";

import { useState, useEffect } from "react";
import type { CreditCardCategory } from "@/types/creditCard";

export function useCreditCardCategories() {
  const [categories, setCategories] = useState<CreditCardCategory[]>([]);

  useEffect(() => {
    fetch("/api/credit-card-categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  async function addCategory(name: string) {
    const res = await fetch("/api/credit-card-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const cat: CreditCardCategory = await res.json();
    setCategories((prev) => [...prev, cat]);
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/credit-card-categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function addSubcategory(categoryId: string, name: string) {
    const res = await fetch(`/api/credit-card-categories/${categoryId}/subcategories`, {
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

  async function deleteSubcategory(categoryId: string, subId: string) {
    await fetch(`/api/credit-card-categories/${categoryId}/subcategories/${subId}`, { method: "DELETE" });
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subId) }
          : c
      )
    );
  }

  return { categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory };
}
