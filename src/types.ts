export const APP_VERSION = "2.0.0";

export type TransactionType = "expense" | "topup";

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  /** Всегда положительная. Знак выводится из type. */
  amount: number;
  hasReceipt: boolean;
  /** ISO-строка даты */
  date: string;
  balanceAfter: number;
}

export interface Report {
  id: string;
  transactions: Transaction[];
  totalTopup: number;
  totalExpense: number;
  finalBalance: number;
  startDate: string;
  endDate: string;
}

export interface AppData {
  version: string;
  balance: number;
  transactions: Transaction[];
  reports: Report[];
  quickCategories?: string[];
  categoryHints?: Record<string, number[]>;
}

/** Нормализованное состояние (после миграции старых бэкапов). */
export interface AppState {
  version: string;
  balance: number;
  transactions: Transaction[];
  reports: Report[];
  quickCategories: string[];
  categoryHints: Record<string, number[]>;
}
