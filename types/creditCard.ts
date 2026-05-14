export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  closingDay?: number;
  dueDay?: number;
  color?: string;
  createdAt: string;
}

export type CreditCardChargeType = "assinatura" | "parcelado" | "avulso";

export interface CreditCardCharge {
  id: string;
  cardId: string;
  name: string;
  value: number;
  type: CreditCardChargeType;
  installments?: number;
  startDate: string;
  endDate?: string;
  categoryId?: string;
  subcategoryId?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface CreditCardSubcategory {
  id: string;
  categoryId: string;
  name: string;
}

export interface CreditCardCategory {
  id: string;
  name: string;
  subcategories: CreditCardSubcategory[];
  createdAt: string;
}
