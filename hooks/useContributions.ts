"use client";

import { useState, useEffect } from "react";
import type { Contribution } from "@/types/contribution";

const STORAGE_KEY = "dash-finance-contributions";

export function useContributions() {
  const [contributions, setContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setContributions(JSON.parse(stored));
    } catch {
      // ignore malformed storage
    }
  }, []);

  function addContribution(data: Omit<Contribution, "id" | "createdAt">) {
    const contribution: Contribution = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setContributions((prev) => {
      const next = [contribution, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function deleteContribution(id: string) {
    setContributions((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return { contributions, addContribution, deleteContribution };
}
