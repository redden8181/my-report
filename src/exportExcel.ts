import XLSX from 'xlsx-js-style';
import type { Transaction } from './types';

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}
function fmtDateHuman(iso: string) { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; }
function fmtDateHumanFull(iso: string) { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function fmtMoney(n: number) { return n.toLocaleString('ru-RU') + ' ₽'; }

function buildFileName(startDate: string, endDate: string): string {
  const s = new Date(startDate), e = new Date(endDate);
  return s.getFullYear() === e.getFullYear()
    ? `${fmtDateHuman(startDate)} - ${fmtDateHumanFull(endDate)}.xlsx`
    : `${fmtDateHumanFull(startDate)} - ${fmtDateHumanFull(endDate)}.xlsx`;
}

// ─── Borders ───
const thin = { style: 'thin', color: { rgb: '000000' } };
const medium = { style: 'medium', color: { rgb: '000000' } };
const bThin = { top: thin, bottom: thin, left: thin, right: thin };
const bMedium = { top: medium, bottom: medium, left: medium, right: medium };
const bThickBottom = { top: thin, bottom: medium, left: thin, right: thin };

// ─── Styles ───
const sTitle = {
  font: { bold: true, sz: 14 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: bMedium,
};

const sPeriod = {
  font: { sz: 10, italic: true },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: bMedium,
};

const sHeader = {
  font: { bold: true, sz: 10 },
  fill: { fgColor: { rgb: 'D9D9D9' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: bMedium,
};

const sCell = (h: 'left' | 'center' | 'right', bold = false, bottomMedium = false) => ({
  font: { sz: 10, bold },
  alignment: { horizontal: h, vertical: 'center' as const },
  border: bottomMedium ? bThickBottom : bThin,
});

const sSummaryLabel = {
  font: { bold: true, sz: 11 },
  alignment: { horizontal: 'right' as const, vertical: 'center' as const },
  border: bThin,
};

const sSummaryValue = (sz = 11, bold = true) => ({
  font: { bold, sz },
  alignment: { horizontal: 'right' as const, vertical: 'center' as const },
  border: bThin,
});

const sSummaryEmpty = { border: bThin };

const sTotalLabel = {
  font: { bold: true, sz: 12 },
  alignment: { horizontal: 'right' as const, vertical: 'center' as const },
  border: bMedium,
  fill: { fgColor: { rgb: 'D9D9D9' } },
};

const sTotalValue = {
  font: { bold: true, sz: 14 },
  alignment: { horizontal: 'right' as const, vertical: 'center' as const },
  border: bMedium,
  fill: { fgColor: { rgb: 'D9D9D9' } },
};

const sTotalEmpty = { border: bMedium, fill: { fgColor: { rgb: 'D9D9D9' } } };

export function generateReportExcel(
  transactions: Transaction[],
  totalTopup: number,
  totalExpense: number,
  finalBalance: number,
  startDate: string,
  endDate: string,
): Blob {
  const sorted = [...transactions].reverse();
  const ws: XLSX.WorkSheet = {};

  const ROW_HEADER = 3;
  const ROW_DATA_START = 4;
  const dataCount = sorted.length;
  const isLastRow = (i: number) => i === dataCount - 1;
  const ROW_SUMMARY_START = ROW_DATA_START + dataCount + 1;

  // ─── Title ───
  ws['A1'] = { v: 'Отчёт о расходах', t: 's', s: sTitle };
  for (let c = 1; c <= 5; c++) ws[XLSX.utils.encode_cell({ r: 0, c })] = { v: '', t: 's', s: sTitle };

  // ─── Period ───
  ws['A2'] = { v: `Период: ${fmtDate(startDate)} — ${fmtDate(endDate)}`, t: 's', s: sPeriod };
  for (let c = 1; c <= 5; c++) ws[XLSX.utils.encode_cell({ r: 1, c })] = { v: '', t: 's', s: sPeriod };

  // ─── Header ───
  ['№', 'Дата', 'Категория', 'Сумма', 'Чек', 'Баланс'].forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: ROW_HEADER, c })] = { v: h, t: 's', s: sHeader };
  });

  // ─── Data ───
  sorted.forEach((t, i) => {
    const r = ROW_DATA_START + i;
    const last = isLastRow(i);
    const isTopup = t.type === 'topup';

    ws[XLSX.utils.encode_cell({ r, c: 0 })] = { v: i + 1, t: 'n', s: sCell('center', false, last) };
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = { v: fmtDate(t.date), t: 's', s: sCell('center', false, last) };
    ws[XLSX.utils.encode_cell({ r, c: 2 })] = { v: t.category, t: 's', s: sCell('left', false, last) };
    ws[XLSX.utils.encode_cell({ r, c: 3 })] = { v: (isTopup ? '+' : '−') + fmtMoney(t.amount), t: 's', s: sCell('right', true, last) };
    ws[XLSX.utils.encode_cell({ r, c: 4 })] = { v: isTopup ? '—' : (t.hasReceipt ? 'Есть' : '—'), t: 's', s: sCell('center', false, last) };
    ws[XLSX.utils.encode_cell({ r, c: 5 })] = { v: fmtMoney(t.balanceAfter), t: 's', s: sCell('right', true, last) };
  });

  // ─── Summary ───
  const summaryRows: Array<{ label: string; value: string; isTotal: boolean }> = [
    { label: 'Итого пополнено:', value: '+' + fmtMoney(totalTopup), isTotal: false },
    { label: 'Итого расходов:', value: '−' + fmtMoney(totalExpense), isTotal: false },
    { label: 'ОСТАТОК:', value: fmtMoney(finalBalance), isTotal: true },
  ];
  if (finalBalance < 0) {
    summaryRows.push({ label: 'ДОЛГ:', value: fmtMoney(Math.abs(finalBalance)), isTotal: true });
  }

  summaryRows.forEach((row, i) => {
    const r = ROW_SUMMARY_START + i;
    if (row.isTotal) {
      ws[XLSX.utils.encode_cell({ r, c: 0 })] = { v: '', t: 's', s: sTotalEmpty };
      ws[XLSX.utils.encode_cell({ r, c: 1 })] = { v: '', t: 's', s: sTotalEmpty };
      ws[XLSX.utils.encode_cell({ r, c: 2 })] = { v: row.label, t: 's', s: sTotalLabel };
      ws[XLSX.utils.encode_cell({ r, c: 3 })] = { v: row.value, t: 's', s: sTotalValue };
      ws[XLSX.utils.encode_cell({ r, c: 4 })] = { v: '', t: 's', s: sTotalEmpty };
      ws[XLSX.utils.encode_cell({ r, c: 5 })] = { v: '', t: 's', s: sTotalEmpty };
    } else {
      ws[XLSX.utils.encode_cell({ r, c: 0 })] = { v: '', t: 's', s: sSummaryEmpty };
      ws[XLSX.utils.encode_cell({ r, c: 1 })] = { v: '', t: 's', s: sSummaryEmpty };
      ws[XLSX.utils.encode_cell({ r, c: 2 })] = { v: row.label, t: 's', s: sSummaryLabel };
      ws[XLSX.utils.encode_cell({ r, c: 3 })] = { v: row.value, t: 's', s: sSummaryValue() };
      ws[XLSX.utils.encode_cell({ r, c: 4 })] = { v: '', t: 's', s: sSummaryEmpty };
      ws[XLSX.utils.encode_cell({ r, c: 5 })] = { v: '', t: 's', s: sSummaryEmpty };
    }
  });

  // ─── Sheet config ───
  const lastRow = ROW_SUMMARY_START + summaryRows.length - 1;
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow, c: 5 } });

  ws['!cols'] = [
    { wch: 5 },   // №
    { wch: 12 },  // Дата
    { wch: 28 },  // Категория
    { wch: 18 },  // Сумма
    { wch: 6 },   // Чек
    { wch: 18 },  // Баланс
  ];

  ws['!rows'] = [
    { hpt: 26 },  // Title
    { hpt: 20 },  // Period
    { hpt: 6 },   // Empty
    { hpt: 22 },  // Header
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Отчёт');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function shareReport(
  transactions: Transaction[],
  totalTopup: number,
  totalExpense: number,
  finalBalance: number,
  startDate: string,
  endDate: string,
) {
  const blob = generateReportExcel(transactions, totalTopup, totalExpense, finalBalance, startDate, endDate);
  const fileName = buildFileName(startDate, endDate);

  if (navigator.share && navigator.canShare) {
    const file = new File([blob], fileName, { type: blob.type });
    const shareData: ShareData = { files: [file] };
    if (navigator.canShare(shareData)) {
      try { await navigator.share(shareData); return; } catch {}
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName; a.click();
  URL.revokeObjectURL(url);
}
