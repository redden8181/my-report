export interface Transaction {
  id: string;
  type: 'expense' | 'topup';
  category: string;
  amount: number;
  hasReceipt: boolean;
  date: string; // ISO string
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
