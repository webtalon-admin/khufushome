export type AccountType = "checking" | "savings" | "credit" | "investment";

export type TransactionType = "income" | "expense" | "transfer";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string | null;
  date: string;
  recurring: boolean;
  recurring_interval: string | null;
  created_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  name: string;
  principal: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number | null;
  start_date: string;
  created_at: string;
}

export interface TaxRecord {
  id: string;
  user_id: string;
  year: number;
  gross_income: number | null;
  deductions: Record<string, unknown>;
  tax_paid: number | null;
  notes: string | null;
  created_at: string;
}
