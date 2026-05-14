"use client";

import { useState, useEffect } from "react";
import type { CreditCard } from "@/types/creditCard";

export function useCreditCards() {
  const [cards, setCards] = useState<CreditCard[]>([]);

  useEffect(() => {
    fetch("/api/credit-cards")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCards(data); })
      .catch(() => {});
  }, []);

  async function addCard(data: Omit<CreditCard, "id" | "createdAt">) {
    const res = await fetch("/api/credit-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const card: CreditCard = await res.json();
    setCards((prev) => [...prev, card]);
    return card;
  }

  async function deleteCard(id: string) {
    await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  return { cards, addCard, deleteCard };
}
