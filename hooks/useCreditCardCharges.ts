"use client";

import { useState, useEffect } from "react";
import type { CreditCardCharge } from "@/types/creditCard";

export function useCreditCardCharges() {
  const [charges, setCharges] = useState<CreditCardCharge[]>([]);

  useEffect(() => {
    fetch("/api/credit-card-charges")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCharges(data); })
      .catch(() => {});
  }, []);

  async function addCharge(data: Omit<CreditCardCharge, "id" | "createdAt">) {
    const res = await fetch("/api/credit-card-charges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const charge: CreditCardCharge = await res.json();
    setCharges((prev) => [charge, ...prev]);
    return charge;
  }

  async function updateCharge(id: string, data: Partial<Omit<CreditCardCharge, "id" | "createdAt">>) {
    const res = await fetch(`/api/credit-card-charges/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated: CreditCardCharge = await res.json();
    setCharges((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  async function deleteCharge(id: string) {
    await fetch(`/api/credit-card-charges/${id}`, { method: "DELETE" });
    setCharges((prev) => prev.filter((c) => c.id !== id));
  }

  return { charges, addCharge, updateCharge, deleteCharge };
}
