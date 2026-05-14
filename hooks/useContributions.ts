"use client";

import { useState, useEffect } from "react";
import type { Contribution } from "@/types/contribution";

export function useContributions(userId: string) {
  const storageKey = `dash-finance-contributions-${userId}`;
  const [contributions, setContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setContributions(JSON.parse(stored));
      else setContributions([]);
    } catch {
      // ignore malformed storage
    }
  }, [storageKey]);

  function addContribution(data: Omit<Contribution, "id" | "createdAt">) {
    const contribution: Contribution = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setContributions((prev) => {
      const next = [contribution, ...prev];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function deleteContribution(id: string) {
    setContributions((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  return { contributions, addContribution, deleteContribution };
}
