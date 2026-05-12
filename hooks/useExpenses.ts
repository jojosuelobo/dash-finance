"use client";

import { useState, useEffect } from "react";
import type { Expense } from "@/types/expense";

const STORAGE_KEY = "dash-finance-expenses";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setExpenses(JSON.parse(stored));
    } catch {
      // ignore malformed storage
    }
  }, []);

  function addExpense(data: Omit<Expense, "id" | "createdAt">) {
    const expense: Expense = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => {
      const next = [expense, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function deleteExpense(id: string) {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function updateExpense(id: string, updates: Partial<Expense>) {
    setExpenses((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return { expenses, addExpense, deleteExpense, updateExpense };
}
