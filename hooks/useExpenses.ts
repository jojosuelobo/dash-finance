"use client";

import { useState, useEffect } from "react";
import type { Expense } from "@/types/expense";

export function useExpenses(userId: string) {
  const storageKey = `dash-finance-expenses-${userId}`;
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setExpenses(JSON.parse(stored));
      else setExpenses([]);
    } catch {
      // ignore malformed storage
    }
  }, [storageKey]);

  function addExpense(data: Omit<Expense, "id" | "createdAt">) {
    const expense: Expense = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => {
      const next = [expense, ...prev];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function deleteExpense(id: string) {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function updateExpense(id: string, updates: Partial<Expense>) {
    setExpenses((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  return { expenses, addExpense, deleteExpense, updateExpense };
}
