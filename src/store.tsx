import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Transaction, Report, AppData } from './types';

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const APP_VERSION = '1.2.0';

// Build date: injected by Vite at build time, fallback to current date
const rawBuildDate = import.meta.env.VITE_BUILD_DATE as string | undefined;
export const BUILD_DATE = rawBuildDate || new Date().toISOString();

export const DEFAULT_CATEGORIES = ['АЗС', 'Мойка', 'Парковка', 'Платка', 'Аптека', 'Магазин'];
export const DEFAULT_HINTS: Record<string, number[]> = {
  'Парковка': [150, 380, 450, 600, 800],
};

interface State {
  balance: number;
  transactions: Transaction[];
  reports: Report[];
  quickCategories: string[];
  categoryHints: Record<string, number[]>;
}

type Action =
  | { type: 'TOPUP'; amount: number }
  | { type: 'ADD_EXPENSE'; category: string; amount: number; hasReceipt: boolean }
  | { type: 'EDIT_TRANSACTION'; id: string; category: string; amount: number; hasReceipt: boolean }
  | { type: 'DELETE_TRANSACTION'; id: string }
  | { type: 'NEW_REPORT' }
  | { type: 'LOAD_DATA'; data: AppData }
  | { type: 'SET_CATEGORIES'; categories: string[] }
  | { type: 'SET_HINTS'; category: string; hints: number[] }
  | { type: 'SET_STATE'; state: State };

function recalculateBalances(transactions: Transaction[], startBalance: number): Transaction[] {
  let running = startBalance;
  const reversed = [...transactions].reverse();
  const result: Transaction[] = [];
  for (const t of reversed) {
    if (t.type === 'topup') running += t.amount; else running -= t.amount;
    result.push({ ...t, balanceAfter: running });
  }
  return result.reverse();
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TOPUP': {
      const nb = state.balance + action.amount;
      return { ...state, balance: nb, transactions: [{ id: uuidv4(), type: 'topup', category: 'Пополнение', amount: action.amount, hasReceipt: false, date: new Date().toISOString(), balanceAfter: nb }, ...state.transactions] };
    }
    case 'ADD_EXPENSE': {
      const nb = state.balance - action.amount;
      return { ...state, balance: nb, transactions: [{ id: uuidv4(), type: 'expense', category: action.category, amount: action.amount, hasReceipt: action.hasReceipt, date: new Date().toISOString(), balanceAfter: nb }, ...state.transactions] };
    }
    case 'EDIT_TRANSACTION': {
      const idx = state.transactions.findIndex(t => t.id === action.id);
      if (idx === -1) return state;
      const old = state.transactions[idx];
      let diff = 0;
      if (old.type === 'expense') diff = old.amount - action.amount;
      else if (old.type === 'topup') diff = action.amount - old.amount;
      let sb = state.balance;
      for (const t of state.transactions) { if (t.type === 'topup') sb -= t.amount; else sb += t.amount; }
      const updated = [...state.transactions];
      updated[idx] = { ...old, category: action.category, amount: action.amount, hasReceipt: action.hasReceipt };
      return { ...state, balance: state.balance + diff, transactions: recalculateBalances(updated, sb) };
    }
    case 'DELETE_TRANSACTION': {
      const t = state.transactions.find(tr => tr.id === action.id);
      if (!t) return state;
      const nb = t.type === 'expense' ? state.balance + t.amount : state.balance - t.amount;
      const rem = state.transactions.filter(tr => tr.id !== action.id);
      let sb = nb; for (const tr of rem) { if (tr.type === 'topup') sb -= tr.amount; else sb += tr.amount; }
      return { ...state, balance: nb, transactions: recalculateBalances(rem, sb) };
    }
    case 'NEW_REPORT': {
      if (state.transactions.length === 0) return state;
      const tt = state.transactions.filter(t => t.type === 'topup').reduce((s, t) => s + t.amount, 0);
      const te = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const dates = state.transactions.map(t => t.date);
      const report: Report = { id: uuidv4(), transactions: [...state.transactions], totalTopup: tt, totalExpense: te, finalBalance: state.balance, startDate: dates[dates.length - 1], endDate: dates[0] };
      const carry: Transaction[] = [];
      if (state.balance !== 0) {
        const debt = state.balance < 0;
        carry.push({ id: uuidv4(), type: debt ? 'expense' : 'topup', category: debt ? 'Долг с прошлого отчёта' : 'Остаток с прошлого отчёта', amount: Math.abs(state.balance), hasReceipt: false, date: new Date().toISOString(), balanceAfter: state.balance });
      }
      return { ...state, transactions: carry, reports: [report, ...state.reports] };
    }
    case 'LOAD_DATA':
      return { balance: action.data.balance ?? 0, transactions: action.data.transactions ?? [], reports: action.data.reports ?? [], quickCategories: action.data.quickCategories ?? DEFAULT_CATEGORIES, categoryHints: action.data.categoryHints ?? DEFAULT_HINTS };
    case 'SET_CATEGORIES':
      return { ...state, quickCategories: action.categories };
    case 'SET_HINTS': {
      const hints = { ...state.categoryHints };
      if (action.hints.length === 0) delete hints[action.category];
      else hints[action.category] = action.hints;
      return { ...state, categoryHints: hints };
    }
    case 'SET_STATE':
      return action.state;
    default:
      return state;
  }
}

const initialState: State = { balance: 0, transactions: [], reports: [], quickCategories: DEFAULT_CATEGORIES, categoryHints: DEFAULT_HINTS };

function loadState(): State {
  try {
    const saved = localStorage.getItem('otchet_app_data');
    if (saved) {
      const d = JSON.parse(saved);
      if (d && typeof d.balance === 'number' && Array.isArray(d.transactions)) {
        return { balance: d.balance, transactions: d.transactions, reports: Array.isArray(d.reports) ? d.reports : [], quickCategories: Array.isArray(d.quickCategories) ? d.quickCategories : DEFAULT_CATEGORIES, categoryHints: (d.categoryHints && typeof d.categoryHints === 'object') ? d.categoryHints : DEFAULT_HINTS };
      }
    }
  } catch { localStorage.removeItem('otchet_app_data'); }
  return initialState;
}

interface Ctx { state: State; dispatch: React.Dispatch<Action>; }
const StoreContext = createContext<Ctx>({ state: initialState, dispatch: () => {} });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, loadState);
  useEffect(() => {
    try {
      const data: AppData = { version: APP_VERSION, balance: state.balance, transactions: state.transactions, reports: state.reports, quickCategories: state.quickCategories, categoryHints: state.categoryHints };
      localStorage.setItem('otchet_app_data', JSON.stringify(data));
    } catch {}
  }, [state]);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() { return useContext(StoreContext); }
