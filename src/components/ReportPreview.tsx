import { useMemo, useState } from "react";
import { ChevronRight, ClipboardCheck, FileUp } from "lucide-react";
import { useStore } from "../store";
import type { Report } from "../types";
import { chronological, fmtDayMonth, nfAmount, round2 } from "../utils";
import { shareReportXlsx } from "../exportExcel";
import { LedgerEmpty, LedgerTable, LedgerTotals } from "./Ledger";
import { NewReportFlow } from "./NewReportFlow";
import { ScreenHead, SectionTitle, useToast } from "./ui";

/** Сводка текущего (незавершённого) периода в форме отчёта. */
export function currentAsReport(txs: Report["transactions"]): Report | null {
  if (txs.length === 0) return null;
  const totalTopup = round2(
    txs.filter((t) => t.type === "topup").reduce((s, t) => s + t.amount, 0)
  );
  const totalExpense = round2(
    txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  );
  // строго по дате: старые сверху, новые снизу + пересчёт балансов
  const ordered = chronological(txs);
  return {
    id: "current",
    transactions: ordered,
    totalTopup,
    totalExpense,
    finalBalance: ordered[ordered.length - 1].balanceAfter,
    startDate: ordered[0].date,
    endDate: new Date().toISOString(),
  };
}

function Stat({
  label,
  value,
  cls,
}: {
  label: string;
  value: string;
  cls: string;
}) {
  return (
    <div className="panel rounded-2xl p-3">
      <div className="micro font-mono text-muted">{label}</div>
      <div className={`mt-1.5 font-mono text-[15px] font-bold ${cls}`}>
        {value}
      </div>
    </div>
  );
}

export function ReportPreview() {
  const { data, closeReport } = useStore();
  const { show, node } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const report = useMemo(
    () => currentAsReport(data.transactions),
    [data.transactions]
  );

  /** Возвращает true, если файл реально ушёл (отправлен или скачан). */
  const share = async (): Promise<boolean> => {
    if (!report || sharing) return false;
    setSharing(true);
    try {
      const res = await shareReportXlsx(report);
      if (res === "shared") {
        show("Excel отправлен");
        return true;
      }
      if (res === "downloaded") {
        show("Excel сохранён в файлы");
        return true;
      }
      show("Отправка отменена");
      return false;
    } catch {
      show("Не удалось сформировать Excel", "error");
      return false;
    } finally {
      setSharing(false);
    }
  };

  const finish = () => {
    closeReport(true);
    setConfirmOpen(false);
    show("Отчёт сохранён в архив");
  };

  const empty = !report;
  const debt = !!report && report.finalBalance < 0;

  return (
    <div className="fade-up pb-2">
      <ScreenHead
        kicker="Текущий период"
        title="Отчёт"
        sub={
          report
            ? `С ${fmtDayMonth(report.startDate)} · ${report.transactions.length} операций`
            : "Период ещё не начат"
        }
      />

      {/* сводка */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2.5">
        <Stat
          label="Пополнено"
          value={`+${nfAmount(report?.totalTopup ?? 0)}`}
          cls="text-income"
        />
        <Stat
          label="Потрачено"
          value={`−${nfAmount(report?.totalExpense ?? 0)}`}
          cls="text-ink"
        />
        <Stat
          label={debt ? "Долг" : "Остаток"}
          value={nfAmount(Math.abs(report?.finalBalance ?? 0))}
          cls={debt ? "text-burn" : "text-pine"}
        />
      </div>

      {/* действия — сразу вверху: за файлом заходят в первую очередь */}
      <div className="mx-4 mt-3 space-y-2.5">
        {/* сдать отчёт: проверка чеков → Excel → новый период */}
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={empty}
          className={`w-full rounded-2xl px-4 py-4 text-left transition active:scale-[0.98] ${
            empty ? "bg-tint" : "pine-glow bg-pine"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                empty ? "bg-card/60 text-muted" : "bg-card/15 text-card"
              }`}
            >
              <ClipboardCheck size={21} strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block font-display text-[16px] font-extrabold leading-tight ${
                  empty ? "text-muted" : "text-card"
                }`}
              >
                Сдать отчёт, начать новый
              </span>
              <span
                className={`mt-0.5 block text-[11px] leading-snug ${
                  empty ? "text-muted/70" : "text-card/70"
                }`}
              >
                Проверим чеки → соберём Excel → откроем новый период
              </span>
            </span>
            <ChevronRight
              size={18}
              strokeWidth={2.6}
              className={empty ? "text-muted/50" : "text-card/60"}
            />
          </div>
        </button>

        {/* быстрый экспорт без закрытия периода */}
        <button
          type="button"
          onClick={share}
          disabled={empty || sharing}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl border py-3.5 text-[14px] font-bold transition active:scale-[0.98] ${
            empty
              ? "border-edge bg-card text-muted/50"
              : "border-pine/30 bg-card text-pine"
          }`}
        >
          <FileUp size={17} strokeWidth={2.6} />
          {sharing ? "Формирую файл…" : "Просто скачать Excel сейчас"}
        </button>
      </div>

      {/* журнал операций */}
      <SectionTitle>Операции периода</SectionTitle>
      <div className="panel mx-4 overflow-hidden rounded-[24px] px-4 py-4">
        {empty ? (
          <LedgerEmpty hint="Пока нечего показывать — добавьте операции на главном экране" />
        ) : (
          <>
            <LedgerTable txs={report.transactions} />
            <LedgerTotals
              topup={report.totalTopup}
              expense={report.totalExpense}
              balance={report.finalBalance}
            />
          </>
        )}
      </div>

      {/* мастер закрытия периода с проверкой чеков */}
      <NewReportFlow
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        report={report}
        onShare={share}
        sharing={sharing}
        onFinish={finish}
      />

      {node}
    </div>
  );
}
