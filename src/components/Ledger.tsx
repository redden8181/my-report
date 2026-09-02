import { Check, FileText } from "lucide-react";
import type { Transaction } from "../types";
import { fmtShort, fmtTime, nfAmount } from "../utils";

/**
 * Журнал операций в стиле кассовой ленты:
 * моноширинные числа, зелёные приходы, тёмные расходы.
 */
export function LedgerTable({ txs }: { txs: Transaction[] }) {
  return (
    <table className="w-full table-fixed">
      <colgroup>
        <col className="w-[26px]" />
        <col className="w-[48px]" />
        <col />
        <col className="w-[86px]" />
        <col className="w-[30px]" />
        <col className="w-[66px]" />
      </colgroup>
      <thead>
        <tr className="border-b border-edge text-left">
          <th className="micro pb-2 text-center font-mono text-muted">№</th>
          <th className="micro pb-2 font-mono text-muted">Дата</th>
          <th className="micro pb-2 font-mono text-muted">Категория</th>
          <th className="micro pb-2 text-right font-mono text-muted">Сумма</th>
          <th className="micro pb-2 text-center font-mono text-muted">Чек</th>
          <th className="micro pb-2 text-right font-mono text-muted">Баланс</th>
        </tr>
      </thead>
      <tbody>
        {txs.map((t, i) => {
          const topup = t.type === "topup";
          return (
            <tr
              key={t.id}
              className="border-b border-dashed border-edge last:border-0"
            >
              <td className="py-2.5 text-center font-mono text-[10px] text-muted/70">
                {i + 1}
              </td>
              <td className="py-2.5">
                <div className="font-mono text-[11px] font-bold leading-tight text-ink">
                  {fmtShort(t.date)}
                </div>
                <div className="font-mono text-[10px] leading-tight text-muted/80">
                  {fmtTime(t.date)}
                </div>
              </td>
              <td className="truncate py-2.5 pr-1 text-[12px] font-medium text-ink">
                {t.category}
              </td>
              <td
                className={`py-2.5 text-right font-mono text-[12px] font-bold ${
                  topup ? "text-income" : "text-ink"
                }`}
              >
                {topup ? "+" : "−"}
                {nfAmount(t.amount)}
              </td>
              <td className="py-2.5 text-center">
                {!topup && t.hasReceipt ? (
                  <Check
                    size={13}
                    strokeWidth={3}
                    className="mx-auto text-income"
                  />
                ) : (
                  <span className="font-mono text-[10px] text-muted/40">—</span>
                )}
              </td>
              <td className="py-2.5 text-right font-mono text-[11px] text-muted">
                {nfAmount(t.balanceAfter)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Блок итогов под журналом. */
export function LedgerTotals({
  topup,
  expense,
  balance,
}: {
  topup: number;
  expense: number;
  balance: number;
}) {
  const debt = balance < 0;
  return (
    <div className="mt-4">
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-muted">Пополнено</span>
          <span className="font-mono text-[13px] font-bold text-income">
            +{nfAmount(topup)}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-muted">Потрачено</span>
          <span className="font-mono text-[13px] font-bold text-ink">
            −{nfAmount(Math.abs(expense))}
          </span>
        </div>
      </div>
      <div
        className={`mt-3 flex items-baseline justify-between rounded-xl border px-4 py-3 ${
          debt ? "border-burn/25 bg-burn/8" : "border-pine/20 bg-pine/6"
        }`}
      >
        <span
          className={`micro font-mono ${debt ? "text-burn" : "text-pine"}`}
        >
          {debt ? "Долг" : "Остаток"}
        </span>
        <span
          className={`font-mono text-[20px] font-bold ${
            debt ? "text-burn" : "text-pine"
          }`}
        >
          {nfAmount(Math.abs(balance))} ₽
        </span>
      </div>
    </div>
  );
}

export function LedgerEmpty({ hint }: { hint: string }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-tint">
        <FileText size={22} strokeWidth={1.6} className="text-muted" />
      </div>
      <div className="mt-4 text-[13px] font-medium text-muted">{hint}</div>
    </div>
  );
}
