import { APP_VERSION, Transaction } from "./types";

export const STORAGE_KEY = "otchet_app_data";
export { APP_VERSION };

export const DEFAULT_CATEGORIES = [
  "Транспорт",
  "Питание",
  "ГСМ",
  "Парковка",
  "Канцелярия",
  "Прочее",
];

/* ---------------- ids / numbers ---------------- */

export function uid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* noop */
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

const nfMoney = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Приводит операции к строгому хронологическому порядку (старые сверху,
 * новые снизу) и пересчитывает balanceAfter под этот порядок.
 * Сортировка стабильная: операции с одинаковой датой не меняются местами.
 */
export function chronological<TransactionLike extends { date: string; type: string; amount: number }>(
  txs: TransactionLike[]
): (TransactionLike & { balanceAfter: number })[] {
  const time = (t: { date: string }) => new Date(t.date).getTime();
  const sorted = [...txs].sort((a, b) => time(a) - time(b));

  let balance = 0;
  return sorted.map((t) => {
    balance = round2(balance + (t.type === "topup" ? t.amount : -t.amount));
    return { ...t, balanceAfter: balance };
  });
}

/** "1 234,56 ₽" / "−810 ₽" */
export function formatMoney(n: number, withSymbol = true): string {
  const s = nfMoney.format(Math.abs(n));
  const sign = n < 0 ? "−" : "";
  return `${sign}${s}${withSymbol ? " ₽" : ""}`;
}

/** "1 234,56" / "−810" — число без символа рубля */
export function nfAmount(n: number): string {
  const s = nfMoney.format(Math.abs(n));
  return n < 0 ? `−${s}` : s;
}

/** "+1 500 ₽" / "−810 ₽" — знак показывается всегда */
export function formatSigned(n: number, withSymbol = true): string {
  const s = nfMoney.format(Math.abs(n));
  const sign = n < 0 ? "−" : "+";
  return `${sign}${s}${withSymbol ? " ₽" : ""}`;
}

/** Принимает "1200", "1200,50", "1200.5". Возвращает сумму > 0 или null. */
export function parseAmount(raw: string): number | null {
  const v = raw.trim().replace(/\s+/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  const n = round2(parseFloat(v));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/* ---------------- dates ---------------- */

const pad = (n: number) => String(n).padStart(2, "0");

const nfTime = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});
const nfDayMonth = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
});
const nfDayMonthYear = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const fmtTime = (iso: string): string => nfTime.format(new Date(iso));
export const fmtDayMonth = (iso: string): string =>
  nfDayMonth.format(new Date(iso));
export const fmtDayMonthYear = (iso: string): string =>
  nfDayMonthYear.format(new Date(iso));
export const fmtShort = (iso: string): string => {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
};
export const fmtDateTimeExcel = (iso: string): string => {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};
export const fmtDateExcel = (iso: string): string => {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "2026-06-21" — значение для <input type="date"> (локальное, без UTC-сдвига) */
export function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Разбирает "2026-06-21" в локальную дату (без UTC-сдвига). */
export function fromDateInputValue(v: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * ISO-строка операции для выбранного дня.
 * Время берётся текущее — чтобы операции внутри дня шли по порядку ввода.
 */
export function isoForDay(day: Date): string {
  const now = new Date();
  const d = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );
  return d.toISOString();
}

/** Сколько дней назад: 0 — сегодня, 1 — вчера. */
export function daysAgo(d: Date): number {
  return Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
}

/** "21.06" — короткая метка для кнопки выбора даты. */
export function fmtDayMonthNum(d: Date): string {
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}

/** «Сегодня» / «Вчера» / «21 июня» (с годом, если не текущий) */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Вчера";
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    ? nfDayMonth.format(d)
    : nfDayMonthYear.format(d);
}

/* ---------------- period titles / file names ---------------- */

export function reportTitle(startISO: string, endISO: string): string {
  const s = new Date(startISO);
  const e = new Date(endISO);
  if (s.getFullYear() === e.getFullYear()) {
    return `${nfDayMonth.format(s)} — ${nfDayMonth.format(e)} ${e.getFullYear()}`;
  }
  return `${nfDayMonthYear.format(s)} — ${nfDayMonthYear.format(e)}`;
}

/** "1 июня - 10 июня 2025.xlsx" */
export function reportFileName(startISO: string, endISO: string): string {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const base =
    s.getFullYear() === e.getFullYear()
      ? `${nfDayMonth.format(s)} - ${nfDayMonth.format(e)} ${e.getFullYear()}`
      : `${nfDayMonthYear.format(s)} - ${nfDayMonthYear.format(e)}`;
  return `${base}.xlsx`;
}

/** "отчет_ДД-ММ-ГГГГ_ЧЧ-ММ.json" */
export function backupFileName(d = new Date()): string {
  return `отчет_${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}_${pad(
    d.getHours()
  )}-${pad(d.getMinutes())}.json`;
}

/** Дата сборки: из CI (VITE_BUILD_DATE) либо fallback — Last-Modified документа. */
export const BUILD_DATE: string = (() => {
  const env = (import.meta as unknown as { env?: Record<string, string> })?.env;
  if (env?.VITE_BUILD_DATE) return env.VITE_BUILD_DATE;
  try {
    const d = new Date(document.lastModified);
    if (!Number.isNaN(d.getTime())) {
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
    }
  } catch {
    /* noop */
  }
  return "—";
})();

/* ---------------- files ---------------- */

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------------- search helpers ---------------- */

/** Схлопывает пробелы (включая неразрывные) и приводит к нижнему регистру. */
export const norm = (s: string): string =>
  s.toLowerCase().replace(/[\s ​ ﻿]+/g, " ").trim();

const numFromWord = (w: string): number | null => {
  const v = w.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(v)) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Проверка одного слова запроса: число сравнивается с суммой операции,
 * текст ищется в категории и дате.
 */
export function txMatchesWord(tx: Transaction, word: string): boolean {
  const num = numFromWord(word);
  if (num !== null) {
    // число сравнивается точно: «300» находит только ровно 300
    return Math.abs(tx.amount - num) < 0.005;
  }
  const d = new Date(tx.date);
  const hay = norm(
    [
      tx.category,
      tx.type === "topup" ? "пополнение" : "",
      fmtDateExcel(tx.date),
      fmtDayMonth(tx.date),
      nfDayMonthYear.format(d),
    ].join(" ")
  );
  return hay.includes(word);
}

/** Все слова запроса должны совпасть ("парковка 300"). */
export function txMatchesQuery(tx: Transaction, query: string): boolean {
  const words = norm(query).split(" ").filter(Boolean);
  if (words.length === 0) return false;
  return words.every((w) => txMatchesWord(tx, w));
}
