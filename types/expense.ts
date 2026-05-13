export interface Attachment {
  id: string;
  name: string;
  type: string; // MIME type
  data: string; // base64 data URL
}

export interface Expense {
  id: string;
  name: string;
  value: number;
  type: "fixed" | "one-time";
  fixedMode?: "unlimited" | "installments";
  installments?: number;
  dueDate?: string;          // YYYY-MM-DD
  endDate?: string;          // YYYY-MM (1-based), last month to show (inclusive)
  excludedMonths?: string[]; // ["YYYY-MM", ...] months to skip
  paidMonths?: string[];     // ["YYYY-MM", ...] months marked as paid
  kind?: "expense" | "income";  // defaults to "expense"
  categoryId?: string;
  subcategoryId?: string;
  notes?: string;
  attachments?: Attachment[];
  createdAt: string;
}

export interface DisplayExpense extends Expense {
  displayValue: number;
  installmentInfo?: string;
  isPaid: boolean;
  isOverdue: boolean;
  categoryLabel?: string;
}
