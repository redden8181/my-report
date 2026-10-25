import { useMemo, useState } from "react";
import { Archive, Check, ChevronRight, FileUp, Search, X } from "lucide-react";
import { useStore } from "../store";
import type { Report, Transaction } from "../types";
import {
  formatMoney,
  formatSigned,
  fmtDayMonth,
  fmtTime,
  norm,
  reportTitle,
  txMatchesQuery,
} from "../utils";
import { shareReportXlsx } from "../exportExcel";
import { LedgerTable, LedgerTotals } from "./Ledger";
import { ScreenHead, SectionTitle, Sheet, useToast } from "./ui";

/* ---------- детальный просмотр отчёта из архива ---------- */

function ReportDetail({
  report,
  onClose,
}: {
  report: Report | null;
  onClose: () => void;
}) {
  const { show, node } = useToast();
  const [sharing, setSharing] = useState(false);

  const share = async () => {
    if (!report || sharing) return;
    setSharing(true);
    try {
      const res = await shareReportXlsx(report);
      if (res === "shared") show("Excel отправлен");
      else if (res === "downloaded") show("Excel сохранён в файлы");
      else show("Отправка отменена");
    } catch {
      show("Не удалось сформировать Excel", "error");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Sheet open={!!report} onClose={onClose} title="Отчёт из архива" tall>
      {report && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1">
            <div className="mb-3 font-display text-[16px] font-bold leading-tight text-ink">
              {reportTitle(report.startDate, report.endDate)}
              <span className="ml-2 font-mono text-[11px] font-medium text-muted">
                {report.transactions.length} оп.
              </span>
            </div>
            <div className="panel rounded-[22px] px-4 py-4">
              <LedgerTable txs={report.transactions} />
              <LedgerTotals
                topup={report.totalTopup}
                expense={report.totalExpense}
                balance={report.finalBalance}
              />
            </div>
          </div>
          <div className="px-5 pt-1">
            <button
              type="button"
              onClick={share}
              disabled={sharing}
              className="pine-glow flex w-full items-center justify-center gap-2 rounded-2xl bg-pine py-4 font-display text-[15px] font-extrabold text-card transition active:scale-[0.98]"
            >
              <FileUp size={18} strokeWidth={2.6} />
              {sharing ? "Формирую файл…" : "Отправить Excel снова"}
            </button>
          </div>
        </>
      )}
      {node}
    </Sheet>
  );
}

/* ---------- результаты поиска ---------- */

interface Hit {
  report: Report;
  tx: Transaction;
}

function SearchResults({
  hits,
  onOpen,
}: {
  hits: Hit[];
  onOpen: (r: Report) => void;
}) {
  const reportCount = new Set(hits.map((h) => h.report.id)).size;
  return (
    <div className="fade-up">
      <SectionTitle>
        Найдено: {hits.length} оп. в {reportCount} отчётах
      </SectionTitle>
      <div className="panel mx-4 overflow-hidden rounded-[22px]">
        <div className="divide-y divide-dashed divide-edge">
          {hits.slice(0, 60).map(({ report, tx }) => {
            const topup = tx.type === "topup";
            return (
              <button
                key={tx.id}
                type="button"
                onClick={() => onOpen(report)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-tint/70"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold leading-tight text-ink">
                    {tx.category}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-muted">
                    {fmtDayMonth(tx.date)} · {fmtTime(tx.date)}
                    {tx.hasReceipt && (
                      <Check size={11} strokeWidth={3} className="text-income" />
                    )}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-muted/70">
                    {reportTitle(report.startDate, report.endDate)}
                  </span>
                </span>
                <span
                  className={`shrink-0 font-mono text-[14px] font-bold ${
                    topup ? "text-income" : "text-ink"
                  }`}
                >
                  {formatSigned(topup ? tx.amount : -tx.amount)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {hits.length > 60 && (
        <div className="px-6 pt-2 text-[11px] text-muted">
          Показаны первые 60 совпадений — уточните запрос
        </div>
      )}
    </div>
  );
}

/* ---------- экран архива ---------- */

export function ReportsHistory({ initialSearch = false }: { initialSearch?: boolean }) {
  const { data } = useStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);

  const searching = norm(query).length > 0;

  const hits = useMemo<Hit[]>(() => {
    if (!searching) return [];
    const out: Hit[] = [];
    for (const report of data.reports) {
      for (const tx of report.transactions) {
        if (txMatchesQuery(tx, query)) out.push({ report, tx });
      }
    }
    out.sort((a, b) => b.tx.date.localeCompare(a.tx.date));
    return out;
  }, [data.reports, query, searching]);

  // прячем клавиатуру, иначе она перекроет шторку отчёта
  const openReport = (r: Report) => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    setSelected(r);
  };

  return (
    <div className="fade-up pb-2">
      <ScreenHead
        kicker="Журнал периодов"
        title={initialSearch ? "Поиск расходов" : "Архив"}
        sub={
          data.reports.length
            ? `Завершённых отчётов: ${data.reports.length}`
            : "Завершённых отчётов пока нет"
        }
      />

      <div className="panel mx-4 mt-3 flex items-center gap-2.5 rounded-full py-1 pl-4 pr-1.5">
        <Search size={17} strokeWidth={2.4} className="shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          enterKeyHint="search"
          placeholder={initialSearch ? "Сумма, дата, категория, комментарий" : "Поиск по архиву"}
          className="w-full bg-transparent py-2.5 text-[16px] text-ink outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Очистить"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tint text-muted transition active:scale-90"
          >
            <X size={14} strokeWidth={2.6} />
          </button>
        )}
      </div>

      {searching ? (
        hits.length ? (
          <SearchResults hits={hits} onOpen={openReport} />
        ) : (
          <div className="panel mx-4 mt-3 rounded-[22px] px-6 py-12 text-center">
            <Search
              size={26}
              strokeWidth={1.4}
              className="mx-auto text-muted/50"
            />
            <div className="mt-3 text-[14px] font-semibold text-muted">
              Ничего не найдено
            </div>
            <div className="mt-1 text-[12px] text-muted/70">
              Поиск идёт по завершённым отчётам
            </div>
          </div>
        )
      ) : data.reports.length === 0 ? (
        <div className="panel mx-4 mt-3 rounded-[22px] px-6 py-12 text-center">
          <Archive
            size={26}
            strokeWidth={1.4}
            className="mx-auto text-muted/50"
          />
          <div className="mt-3 text-[14px] font-semibold text-muted">
            Архив пуст
          </div>
          <div className="mt-1 text-[12px] text-muted/70">
            Завершите период на вкладке «Отчёт»
          </div>
        </div>
      ) : (
        <div>
          <SectionTitle>Отчёты</SectionTitle>
          <div className="mx-4 space-y-2.5">
            {data.reports.map((r) => {
              const debt = r.finalBalance < 0;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => openReport(r)}
                  className="panel w-full rounded-[22px] p-4 text-left transition active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 font-display text-[16px] font-bold leading-tight text-ink">
                      {reportTitle(r.startDate, r.endDate)}
                    </div>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tint">
                      <ChevronRight
                        size={15}
                        strokeWidth={2.6}
                        className="text-muted"
                      />
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-lg bg-tint px-2.5 py-1 font-mono text-[11px] font-bold text-muted">
                      {r.transactions.length} оп.
                    </span>
                    <span className="rounded-lg bg-tint px-2.5 py-1 font-mono text-[11px] font-bold text-ink">
                      −{formatMoney(r.totalExpense)}
                    </span>
                    <span
                      className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold ${
                        debt
                          ? "bg-burn/10 text-burn"
                          : "bg-pine/8 text-pine"
                      }`}
                    >
                      {debt ? "долг " : "+"}
                      {formatMoney(Math.abs(r.finalBalance), false)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <ReportDetail report={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
