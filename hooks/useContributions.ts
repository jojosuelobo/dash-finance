"use client";

import { useState, useEffect } from "react";
import type { Contribution } from "@/types/contribution";

// userId is kept in signature for call-site compatibility but auth is handled server-side
export function useContributions(_userId: string) {
  const [contributions, setContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    fetch("/api/contributions")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setContributions(data); })
      .catch(() => {});
  }, []);

  async function addContribution(data: Omit<Contribution, "id" | "createdAt">) {
    const res = await fetch("/api/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const contribution: Contribution = await res.json();
    setContributions((prev) => [contribution, ...prev]);
  }

  async function deleteContribution(id: string) {
    await fetch(`/api/contributions/${id}`, { method: "DELETE" });
    setContributions((prev) => prev.filter((c) => c.id !== id));
  }

  return { contributions, addContribution, deleteContribution };
}
