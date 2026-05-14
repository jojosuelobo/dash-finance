"use client";

import { useState, useEffect } from "react";
import type { Expense } from "@/types/expense";

// userId is kept in signature for call-site compatibility but auth is handled server-side
export function useExpenses(_userId: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setExpenses(data); })
      .catch(() => {});
  }, []);

  async function addExpense(data: Omit<Expense, "id" | "createdAt">) {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const expense: Expense = await res.json();
    setExpenses((prev) => [expense, ...prev]);
  }

  async function deleteExpense(id: string) {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  async function updateExpense(id: string, updates: Partial<Expense>) {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const updated: Expense = await res.json();
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }

  return { expenses, addExpense, deleteExpense, updateExpense };
}
