import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  APP_VERSION,
  type AppState,
  type Report,
  type Transaction,
} from "./types";
import {
  DEFAULT_CATEGORIES,
  STORAGE_KEY,
  chronological,
  round2,
  uid,
} from "./utils";

/* ============ вычисления ============ */

/**
 * Пересчёт balanceAfter. Операции предварительно выстраиваются строго
 * по дате (старые → новые), чтобы порядок не «гулял» в отчётах и Excel.
 */
function recalcTxs(txs: Transaction[]): Transaction[] {
  return chronological(txs);
}

const lastBalance = (txs: Transaction[]): number =>
  txs.length ? txs[txs.length - 1].balanceAfter : 0;

function makeTx(
  patch: Omit<Transaction, "id" | "date" | "balanceAfter">,
  date = new Date().toISOString()
): Transaction {
  return { ...patch, id: uid(), date, balanceAfter: 0 };
}

/* ============ нормализация / миграция данных ============ */

function fixTransaction(raw: unknown): Transaction | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const amount = Number(t.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const type = t.type === "topup" ? "topup" : "expense";
  let date = typeof t.date === "string" ? t.date : "";
  if (Number.isNaN(new Date(date).getTime())) date = new Date().toISOString();
  return {
    id: typeof t.id === "string" && t.id ? t.id : uid(),
    type,
    category:
      typeof t.category === "string" && t.category.trim()
        ? t.category.trim()
        : "Прочее",
    amount: round2(Math.abs(amount)),
    hasReceipt: Boolean(t.hasReceipt),
    comment: typeof t.comment === 'string' ? t.comment : '',
    date,
    balanceAfter: 0,
  };
}

function fixReport(raw: unknown): Report | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const txs = (Array.isArray(r.transactions) ? r.transactions : [])
    .map(fixTransaction)
    .filter((t): t is Transaction => t !== null);
  const fixed = recalcTxs(txs);
  const totalTopup = round2(
    fixed.filter((t) => t.type === "topup").reduce((s, t) => s + t.amount, 0)
  );
  const totalExpense = round2(
    fixed.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  );
  const now = new Date().toISOString();
  return {
    id: typeof r.id === "string" && r.id ? r.id : uid(),
    transactions: fixed,
    totalTopup,
    totalExpense,
    finalBalance: lastBalance(fixed),
    startDate:
      typeof r.startDate === "string" && r.startDate
        ? r.startDate
        : fixed[0]?.date ?? now,
    endDate:
      typeof r.endDate === "string" && r.endDate
        ? r.endDate
        : fixed.at(-1)?.date ?? now,
  };
}

/** Приводит произвольный (например, импортированный) объект к AppState. */
export function normalizeData(raw: unknown): AppState {
  const data = (raw ?? {}) as Record<string, unknown>;

  const transactions = recalcTxs(
    (Array.isArray(data.transactions) ? data.transactions : [])
      .map(fixTransaction)
      .filter((t): t is Transaction => t !== null)
  );

  const reports = (Array.isArray(data.reports) ? data.reports : [])
    .map(fixReport)
    .filter((r): r is Report => r !== null);

  let quickCategories = Array.isArray(data.quickCategories)
    ? (data.quickCategories as unknown[])
        .filter((c): c is string => typeof c === "string" && !!c.trim())
        .map((c) => c.trim())
    : [];
  quickCategories = [...new Set(quickCategories)];
  if (quickCategories.length === 0) quickCategories = [...DEFAULT_CATEGORIES];

  const categoryHints: Record<string, number[]> = {};
  const rawHints = data.categoryHints;
  if (rawHints && typeof rawHints === "object") {
    for (const [key, value] of Object.entries(
      rawHints as Record<string, unknown>
    )) {
      if (!Array.isArray(value)) continue;
      const nums = value
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n > 0)
        .map(round2);
      if (nums.length) categoryHints[key] = [...new Set(nums)];
    }
  }

  return {
    version: APP_VERSION,
    balance: lastBalance(transactions),
    transactions,
    reports,
    quickCategories,
    categoryHints,
  };
}

function loadInitial(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeData(JSON.parse(raw));
  } catch {
    /* повреждённые данные — стартуем чисто */
  }
  return normalizeData(null);
}

/* ============ reducer ============ */

type Action =
  | { type: "ADD_TOPUP"; amount: number }
  | {
      type: "ADD_EXPENSE";
      category: string;
      amount: number;
      hasReceipt: boolean;
      date?: string;
      comment?: string;
    }
  | {
      type: "UPDATE_TX";
      id: string;
      patch: Partial<Pick<Transaction, "category" | "amount" | "hasReceipt" | "date" | "comment">>;
    }
  | { type: "DELETE_TX"; id: string }
  | { type: "UPDATE_ARCHIVED_TX"; reportId:string; id:string; patch:Partial<Pick<Transaction,"category"|"amount"|"hasReceipt"|"date"|"comment">> }
  | { type: "CLOSE_REPORT"; carryOver: boolean }
  | { type: "SET_CATEGORIES"; list: string[] }
  | { type: "SET_HINTS"; category: string; hints: number[] }
  | { type: "IMPORT"; data: unknown };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_TOPUP": {
      const tx = {
        ...makeTx({
          type: "topup",
          category: "Пополнение",
          amount: action.amount,
          hasReceipt: false,
        }),
        balanceAfter: round2(state.balance + action.amount),
      };
      return {
        ...state,
        transactions: [...state.transactions, tx],
        balance: tx.balanceAfter,
      };
    }

    case "ADD_EXPENSE": {
      const tx = makeTx(
        {
          type: "expense",
          category: action.category,
          amount: action.amount,
          hasReceipt: action.hasReceipt,
          comment: action.comment ?? '',
        },
        action.date
      );
      // recalcTxs сортирует по дате: расход «задним числом» встанет
      // на своё место, а балансы пересчитаются по всей цепочке
      const recalced = recalcTxs([...state.transactions, tx]);
      return {
        ...state,
        transactions: recalced,
        balance: lastBalance(recalced),
      };
    }

    case "UPDATE_TX": {
      const txs = state.transactions.map((t) =>
        t.id === action.id
          ? {
              ...t,
              ...action.patch,
              amount:
                action.patch.amount !== undefined
                  ? round2(Math.abs(action.patch.amount))
                  : t.amount,
            }
          : t
      );
      const recalced = recalcTxs(txs);
      return {
        ...state,
        transactions: recalced,
        balance: lastBalance(recalced),
      };
    }

    case "UPDATE_ARCHIVED_TX": {
      return {...state,reports:state.reports.map(report=>{
        if(report.id!==action.reportId)return report;
        const txs=recalcTxs(report.transactions.map(tx=>tx.id===action.id?{...tx,...action.patch}:tx));
        return {...report,transactions:txs,totalTopup:round2(txs.filter(t=>t.type==="topup").reduce((s,t)=>s+t.amount,0)),totalExpense:round2(txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0)),finalBalance:lastBalance(txs)};
      })};
    }
    case "DELETE_TX": {
      const recalced = recalcTxs(
        state.transactions.filter((t) => t.id !== action.id)
      );
      return {
        ...state,
        transactions: recalced,
        balance: lastBalance(recalced),
      };
    }

    case "CLOSE_REPORT": {
      if (state.transactions.length === 0) return state;
      const txs = recalcTxs(state.transactions);
      const totalTopup = round2(
        txs.filter((t) => t.type === "topup").reduce((s, t) => s + t.amount, 0)
      );
      const totalExpense = round2(
        txs
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0)
      );
      const finalBalance = lastBalance(txs);
      const report: Report = {
        id: uid(),
        transactions: txs,
        totalTopup,
        totalExpense,
        finalBalance,
        startDate: txs[0].date,
        endDate: new Date().toISOString(),
      };

      let nextTxs: Transaction[] = [];
      let nextBalance = 0;
      if (action.carryOver && finalBalance !== 0) {
        const carry = makeTx({
          type: finalBalance > 0 ? "topup" : "expense",
          category:
            finalBalance > 0
              ? "Остаток с прошлого отчёта"
              : "Долг с прошлого отчёта",
          amount: Math.abs(finalBalance),
          hasReceipt: false,
        });
        carry.balanceAfter = finalBalance;
        nextTxs = [carry];
        nextBalance = finalBalance;
      }

      return {
        ...state,
        transactions: nextTxs,
        balance: nextBalance,
        reports: [report, ...state.reports],
      };
    }

    case "SET_CATEGORIES": {
      const list = [...new Set(action.list.map((c) => c.trim()).filter(Boolean))];
      const hints: Record<string, number[]> = {};
      for (const c of list) if (state.categoryHints[c]) hints[c] = state.categoryHints[c];
      return { ...state, quickCategories: list, categoryHints: hints };
    }

    case "SET_HINTS": {
      const hints = [
        ...new Set(
          action.hints.filter((n) => Number.isFinite(n) && n > 0).map(round2)
        ),
      ];
      const categoryHints = { ...state.categoryHints };
      if (hints.length) categoryHints[action.category] = hints;
      else delete categoryHints[action.category];
      return { ...state, categoryHints };
    }

    case "IMPORT":
      return normalizeData(action.data);

    default:
      return state;
  }
}

/* ============ контекст ============ */

interface StoreApi {
  data: AppState;
  addTopup: (amount: number) => void;
  addExpense: (
    category: string,
    amount: number,
    hasReceipt: boolean,
    date?: string,
    comment?: string
  ) => void;
  updateTransaction: (
    id: string,
    patch: Partial<Pick<Transaction, "category" | "amount" | "hasReceipt">>
  ) => void;
  deleteTransaction: (id: string) => void;
  updateArchivedTransaction:(reportId:string,id:string,patch:Partial<Pick<Transaction,"category"|"amount"|"hasReceipt"|"date"|"comment">>)=>void;
  closeReport: (carryOver: boolean) => void;
  setCategories: (list: string[]) => void;
  setHints: (category: string, hints: number[]) => void;
  importData: (data: unknown) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* переполнение хранилища — данные останутся в памяти сессии */
    }
  }, [data]);

  const addTopup = useCallback(
    (amount: number) => dispatch({ type: "ADD_TOPUP", amount: round2(amount) }),
    []
  );
  const addExpense = useCallback(
    (category: string, amount: number, hasReceipt: boolean, date?: string, comment?: string) =>
      dispatch({
        type: "ADD_EXPENSE",
        category: category.trim() || "Прочее",
        amount: round2(amount),
        hasReceipt,
        date,
        comment,
      }),
    []
  );
  const updateTransaction = useCallback(
    (id: string, patch: Partial<Pick<Transaction, "category" | "amount" | "hasReceipt">>) =>
      dispatch({ type: "UPDATE_TX", id, patch }),
    []
  );
  const updateArchivedTransaction=useCallback((reportId:string,id:string,patch:Partial<Pick<Transaction,"category"|"amount"|"hasReceipt"|"date"|"comment">>)=>dispatch({type:"UPDATE_ARCHIVED_TX",reportId,id,patch}),[]);
  const deleteTransaction = useCallback(
    (id: string) => dispatch({ type: "DELETE_TX", id }),
    []
  );
  const closeReport = useCallback(
    (carryOver: boolean) => dispatch({ type: "CLOSE_REPORT", carryOver }),
    []
  );
  const setCategories = useCallback(
    (list: string[]) => dispatch({ type: "SET_CATEGORIES", list }),
    []
  );
  const setHints = useCallback(
    (category: string, hints: number[]) =>
      dispatch({ type: "SET_HINTS", category, hints }),
    []
  );
  const importData = useCallback(
    (imported: unknown) => dispatch({ type: "IMPORT", data: imported }),
    []
  );

  const api = useMemo<StoreApi>(
    () => ({
      data,
      addTopup,
      addExpense,
      updateTransaction,
      deleteTransaction,
      updateArchivedTransaction,
      closeReport,
      setCategories,
      setHints,
      importData,
    }),
    [
      data,
      addTopup,
      addExpense,
      updateTransaction,
      deleteTransaction,
      closeReport,
      setCategories,
      setHints,
      importData,
    ]
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore должен вызываться внутри StoreProvider");
  return ctx;
}
