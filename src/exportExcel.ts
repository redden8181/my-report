import * as XLSX from "xlsx-js-style";
import type { Report, Transaction } from "./types";
import {
  backupFileName,
  downloadBlob,
  fmtDateTimeExcel,
  reportFileName,
} from "./utils";

/* Чёрно-белое оформление: тонкие серые границы, серая шапка и блок итогов. */

const THIN = { style: "thin", color: { rgb: "8C8C8C" } } as const;
const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN };

const S_TITLE = {
  font: { bold: true, sz: 14, color: { rgb: "000000" } },
};
const S_PERIOD = { font: { sz: 10, color: { rgb: "595959" } } };
const S_HEAD = {
  font: { bold: true, sz: 10, color: { rgb: "000000" } },
  fill: { patternType: "solid", fgColor: { rgb: "E0E0E0" } },
  border: BORDER,
  alignment: { horizontal: "center", vertical: "center" },
};
const S_BODY = { font: { sz: 10, color: { rgb: "000000" } }, border: BORDER };
const S_BODY_CENTER = {
  ...S_BODY,
  alignment: { horizontal: "center" },
};
const S_TOTAL_LABEL = {
  font: { bold: true, sz: 10, color: { rgb: "000000" } },
  fill: { patternType: "solid", fgColor: { rgb: "F0F0F0" } },
  border: BORDER,
  alignment: { horizontal: "left" },
};
const S_TOTAL_VALUE = {
  font: { bold: true, sz: 10, color: { rgb: "000000" } },
  fill: { patternType: "solid", fgColor: { rgb: "F0F0F0" } },
  border: BORDER,
  alignment: { horizontal: "right" },
};

const MONEY_FMT = "#,##0.00";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type CellRef = { r: number; c: number };
const addr = (p: CellRef) => XLSX.utils.encode_cell(p);

function ensureCell(
  ws: XLSX.WorkSheet,
  p: CellRef
): XLSX.CellObject {
  const a = addr(p);
  if (!ws[a]) ws[a] = { t: "s", v: "" };
  return ws[a] as XLSX.CellObject;
}

function style(ws: XLSX.WorkSheet, p: CellRef, s: object) {
  const cell = ensureCell(ws, p);
  (cell as unknown as { s: object }).s = s;
}

const signed = (t: Transaction) =>
  t.type === "topup" ? t.amount : -t.amount;

/**
 * Строит лист отчёта:
 * заголовок, период, таблица (№, Дата, Категория, Сумма, Чек, Баланс), итоги.
 */
function buildSheet(rep: Report): XLSX.WorkSheet {
  const txs = rep.transactions;

  const title = "Отчёт о расходах";
  const period = `Период: ${fmtDateTimeExcel(rep.startDate).slice(0, 10)} — ${fmtDateTimeExcel(
    rep.endDate
  ).slice(0, 10)}`;

  const HEAD_ROW = 3;
  const rows: (string | number | null)[][] = [
    [title],
    [period],
    [],
    ["№", "Дата", "Категория", "Сумма, ₽", "Чек", "Баланс, ₽"],
  ];

  txs.forEach((t, i) => {
    rows.push([
      i + 1,
      fmtDateTimeExcel(t.date),
      t.category,
      signed(t),
      t.type === "topup" ? "—" : t.hasReceipt ? "Есть" : "—",
      t.balanceAfter,
    ]);
  });

  rows.push([]);
  const totalsStart = rows.length;
  rows.push(["Пополнено", null, null, rep.totalTopup, null, null]);
  rows.push(["Потрачено", null, null, -Math.abs(rep.totalExpense), null, null]);
  const isDebt = rep.finalBalance < 0;
  rows.push([
    isDebt ? "Долг" : "Остаток",
    null,
    null,
    rep.finalBalance,
    null,
    null,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws["!cols"] = [
    { wch: 4 },
    { wch: 17 },
    { wch: 24 },
    { wch: 12 },
    { wch: 7 },
    { wch: 12 },
  ];

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    ...[0, 1, 2].flatMap((k) => [
      { s: { r: totalsStart + k, c: 0 }, e: { r: totalsStart + k, c: 2 } },
      { s: { r: totalsStart + k, c: 3 }, e: { r: totalsStart + k, c: 5 } },
    ]),
  ];

  style(ws, { r: 0, c: 0 }, S_TITLE);
  style(ws, { r: 1, c: 0 }, S_PERIOD);

  for (let c = 0; c < 6; c++) style(ws, { r: HEAD_ROW, c }, S_HEAD);

  for (let i = 0; i < txs.length; i++) {
    const r = HEAD_ROW + 1 + i;
    style(ws, { r, c: 0 }, S_BODY_CENTER);
    style(ws, { r, c: 1 }, S_BODY_CENTER);
    style(ws, { r, c: 2 }, S_BODY);
    const sumCell = ensureCell(ws, { r, c: 3 });
    (sumCell as { s?: object }).s = {
      ...S_BODY,
      alignment: { horizontal: "right" },
    };
    sumCell.z = MONEY_FMT;
    style(ws, { r, c: 4 }, S_BODY_CENTER);
    const balCell = ensureCell(ws, { r, c: 5 });
    (balCell as { s?: object }).s = {
      ...S_BODY,
      alignment: { horizontal: "right" },
    };
    balCell.z = MONEY_FMT;
  }

  for (let k = 0; k < 3; k++) {
    const r = totalsStart + k;
    for (let c = 0; c < 3; c++) style(ws, { r, c }, S_TOTAL_LABEL);
    for (let c = 3; c < 6; c++) style(ws, { r, c }, S_TOTAL_VALUE);
    const v = ensureCell(ws, { r, c: 3 });
    v.z = MONEY_FMT;
  }

  (ws as unknown as { "!pageSetup": object })["!pageSetup"] = {
    orientation: "portrait",
    fitToWidth: 1,
    fitToHeight: 0,
  };

  return ws;
}

function buildWorkbook(rep: Report): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSheet(rep), "Отчёт");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

export type ShareResult = "shared" | "downloaded" | "cancelled";

/** Делится .xlsx через iOS Share Sheet, иначе — скачивает файл. */
export async function shareReportXlsx(rep: Report): Promise<ShareResult> {
  const name = reportFileName(rep.startDate, rep.endDate);

  // 1. Генерация файла — в защите, чтобы точно понимать отказ
  let file: File;
  try {
    const out = buildWorkbook(rep);
    file = new File([out], name, { type: XLSX_MIME });
  } catch (err) {
    console.error("[Отчёт] Не удалось собрать Excel:", err);
    throw err;
  }

  // 2. Системный шаринг (Web Share Level 2), если поддерживается
  const supportsShare =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function";

  if (supportsShare) {
    try {
      if (navigator.canShare({ files: [file] })) {
        // ВАЖНО: передаём только files. Любые title/text iOS превращает
        // в отдельный текстовый файл рядом с .xlsx
        await navigator.share({ files: [file] });
        return "shared";
      }
    } catch (err) {
      // Явная отмена пользователем — не считаем ошибкой и не качаем файл
      if ((err as Error)?.name === "AbortError") return "cancelled";
      console.warn("[Отчёт] Share Sheet отказал, ухожу в скачивание:", err);
    }
  }

  // 3. Fallback — обычное скачивание
  downloadBlob(file, name);
  return "downloaded";
}

/** JSON-бэкап всех данных: Share Sheet либо скачивание. */
export async function shareJsonBackup(data: unknown): Promise<ShareResult> {
  const name = backupFileName();
  const file = new File([JSON.stringify(data, null, 2)], name, {
    type: "application/json",
  });

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function"
  ) {
    try {
      if (navigator.canShare({ files: [file] })) {
        // только files — без title, иначе iOS добавит текстовый файл
        await navigator.share({ files: [file] });
        return "shared";
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return "cancelled";
      console.warn("[Отчёт] Share Sheet отказал, ухожу в скачивание:", err);
    }
  }

  downloadBlob(file, name);
  return "downloaded";
}
