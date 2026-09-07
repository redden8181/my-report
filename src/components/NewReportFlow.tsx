import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  FileUp,
  ReceiptText,
  RotateCw,
  X,
} from "lucide-react";
import { useStore } from "../store";
import type { Report, Transaction } from "../types";
import { fmtDayMonth, fmtTime, nfAmount, reportTitle } from "../utils";
import { Sheet } from "./ui";

type Step = "intro" | "audit" | "finish";

/**
 * Мастер закрытия периода:
 * 1) предложение проверить чеки,
 * 2) пошаговый опрос по каждому расходу,
 * 3) итог, отправка Excel и создание нового отчёта.
 */
export function NewReportFlow({
  open,
  onClose,
  report,
  onShare,
  sharing,
  onFinish,
}: {
  open: boolean;
  onClose: () => void;
  report: Report | null;
  onShare: () => Promise<boolean>;
  sharing: boolean;
  onFinish: () => void;
}) {
  const { updateTransaction } = useStore();
  const [step, setStep] = useState<Step>("intro");
  const [index, setIndex] = useState(0);
  const [shared, setShared] = useState(false);
  // снимок для анимации закрытия: после создания отчёта report становится null
  const [snap, setSnap] = useState<Report | null>(report);

  useEffect(() => {
    if (report) setSnap(report);
  }, [report]);

  useEffect(() => {
    if (open) {
      setStep("intro");
      setIndex(0);
      setShared(false);
    }
  }, [open]);

  const view = report ?? snap;

  const expenses = useMemo<Transaction[]>(
    () => (view ? view.transactions.filter((t) => t.type === "expense") : []),
    [view]
  );

  const withReceipt = expenses.filter((t) => t.hasReceipt).length;
  const withoutReceipt = expenses.length - withReceipt;

  if (!view) return null;

  const current = expenses[index];

  const answer = (hasReceipt: boolean) => {
    if (!current) return;
    if (current.hasReceipt !== hasReceipt) {
      updateTransaction(current.id, { hasReceipt });
    }
    try {
      navigator.vibrate?.(8);
    } catch {
      /* iOS игнорирует — не страшно */
    }
    if (index + 1 >= expenses.length) setStep("finish");
    else setIndex(index + 1);
  };

  const share = async () => {
    const ok = await onShare();
    if (ok) setShared(true);
  };

  const title =
    step === "intro"
      ? "Новый отчёт"
      : step === "audit"
        ? "Проверка чеков"
        : "Отчёт готов";

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="px-5 pb-2 pt-1">
        {/* ---------- шаг 1: предложение проверить ---------- */}
        {step === "intro" && (
          <div className="fade-up">
            <div className="rounded-2xl border border-edge bg-tint p-4">
              <div className="text-[13px] leading-relaxed text-muted">
                Период{" "}
                <span className="font-bold text-ink">
                  {reportTitle(view.startDate, new Date().toISOString())}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-lg bg-card px-2.5 py-1 font-mono text-[11px] font-bold text-muted">
                  {expenses.length} расходов
                </span>
                <span className="rounded-lg bg-pine/8 px-2.5 py-1 font-mono text-[11px] font-bold text-pine">
                  с чеком {withReceipt}
                </span>
                {withoutReceipt > 0 && (
                  <span className="rounded-lg bg-burn/10 px-2.5 py-1 font-mono text-[11px] font-bold text-burn">
                    без чека {withoutReceipt}
                  </span>
                )}
              </div>
            </div>

            {expenses.length > 0 ? (
              <>
                <div className="mt-4 flex items-start gap-2.5 px-1">
                  <ReceiptText
                    size={18}
                    strokeWidth={2}
                    className="mt-0.5 shrink-0 text-pine"
                  />
                  <p className="text-[13px] leading-relaxed text-muted">
                    Пройдёмся по расходам и отметим, где есть чек? Это займёт{" "}
                    {expenses.length}{" "}
                    {expenses.length === 1 ? "шаг" : "шагов"}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIndex(0);
                    setStep("audit");
                  }}
                  className="pine-glow mt-4 w-full rounded-2xl bg-pine py-4 font-display text-[15px] font-extrabold text-card transition active:scale-[0.98]"
                >
                  Да, проверим чеки
                </button>
                <button
                  type="button"
                  onClick={() => setStep("finish")}
                  className="mt-2 w-full rounded-2xl border border-edge bg-tint py-3.5 text-[15px] font-bold text-ink transition active:scale-[0.98]"
                >
                  Нет, всё верно
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setStep("finish")}
                className="pine-glow mt-4 w-full rounded-2xl bg-pine py-4 font-display text-[15px] font-extrabold text-card transition active:scale-[0.98]"
              >
                Продолжить
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-2xl py-3.5 text-[15px] font-bold text-muted transition active:scale-[0.98]"
            >
              Отмена
            </button>
          </div>
        )}

        {/* ---------- шаг 2: опрос по расходам ---------- */}
        {step === "audit" && current && (
          <div>
            {/* прогресс */}
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-tint">
                <div
                  className="h-full rounded-full bg-pine transition-all duration-300"
                  style={{
                    width: `${((index + 1) / expenses.length) * 100}%`,
                  }}
                />
              </div>
              <span className="font-mono text-[11px] font-bold text-muted">
                {index + 1} / {expenses.length}
              </span>
            </div>

            {/* карточка операции */}
            <div
              key={current.id}
              className={`fade-up mt-4 rounded-2xl border-2 p-5 text-center transition-colors duration-200 ${
                current.hasReceipt
                  ? "border-income/40 bg-income/8"
                  : "border-burn/40 bg-burn/8"
              }`}
            >
              <div className="font-mono text-[11px] font-bold text-muted">
                {fmtDayMonth(current.date)} · {fmtTime(current.date)}
              </div>
              <div className="mt-2 truncate font-display text-[20px] font-extrabold text-ink">
                {current.category}
              </div>
              <div className="mt-1 font-mono text-[32px] font-bold leading-none text-ink">
                {nfAmount(current.amount)}{" "}
                <span className="text-[20px] text-pine">₽</span>
              </div>
              <div
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 font-mono text-[12px] font-extrabold ${
                  current.hasReceipt
                    ? "bg-income text-card"
                    : "bg-burn text-card"
                }`}
              >
                {current.hasReceipt ? (
                  <Check size={14} strokeWidth={3.2} />
                ) : (
                  <X size={14} strokeWidth={3.2} />
                )}
                сейчас: {current.hasReceipt ? "чек есть" : "чека нет"}
              </div>
            </div>

            <div className="mt-4 text-center text-[13px] font-medium text-muted">
              Чек по этому расходу есть?
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => answer(false)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-burn py-4 text-[15px] font-extrabold text-card shadow-[0_10px_24px_-12px_rgba(207,68,51,0.8)] transition active:scale-95"
              >
                <X size={18} strokeWidth={3.2} />
                Нет
              </button>
              <button
                type="button"
                onClick={() => answer(true)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-income py-4 text-[15px] font-extrabold text-card shadow-[0_10px_24px_-12px_rgba(13,154,99,0.8)] transition active:scale-95"
              >
                <Check size={19} strokeWidth={3.2} />
                Есть
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIndex(Math.max(0, index - 1))}
                disabled={index === 0}
                className="flex items-center gap-1.5 rounded-full px-2 py-2 text-[13px] font-bold text-muted transition active:scale-95 disabled:opacity-30"
              >
                <ArrowLeft size={15} strokeWidth={2.6} />
                Назад
              </button>
              <button
                type="button"
                onClick={() => setStep("finish")}
                className="rounded-full px-2 py-2 text-[13px] font-bold text-muted transition active:scale-95"
              >
                Пропустить проверку
              </button>
            </div>
          </div>
        )}

        {/* ---------- шаг 3: итог ---------- */}
        {step === "finish" && (
          <div className="fade-up">
            <div className="rounded-2xl border border-edge bg-tint p-4">
              <div className="text-[13px] leading-relaxed text-muted">
                Период{" "}
                <span className="font-bold text-ink">
                  {reportTitle(view.startDate, new Date().toISOString())}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-lg bg-card px-2.5 py-1 font-mono text-[11px] font-bold text-muted">
                  {view.transactions.length} операций
                </span>
                <span className="rounded-lg bg-pine/8 px-2.5 py-1 font-mono text-[11px] font-bold text-pine">
                  с чеком {withReceipt}
                </span>
                {withoutReceipt > 0 && (
                  <span className="rounded-lg bg-burn/10 px-2.5 py-1 font-mono text-[11px] font-bold text-burn">
                    без чека {withoutReceipt}
                  </span>
                )}
              </div>
              {view.finalBalance !== 0 && (
                <div className="mt-2.5 font-mono text-[12px] font-medium text-muted">
                  {view.finalBalance < 0 ? "Долг" : "Остаток"}{" "}
                  <span
                    className={`font-bold ${
                      view.finalBalance < 0 ? "text-burn" : "text-pine"
                    }`}
                  >
                    {nfAmount(Math.abs(view.finalBalance))} ₽
                  </span>{" "}
                  перейдёт в новый период
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={share}
              disabled={sharing}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-display text-[15px] font-extrabold transition active:scale-[0.98] ${
                shared
                  ? "border border-edge bg-tint text-ink"
                  : "pine-glow bg-pine text-card"
              }`}
            >
              {shared ? (
                <Check size={18} strokeWidth={3} className="text-pine" />
              ) : (
                <FileUp size={18} strokeWidth={2.6} />
              )}
              {sharing
                ? "Формирую файл…"
                : shared
                  ? "Отправить Excel ещё раз"
                  : "Поделиться Excel"}
            </button>

            <button
              type="button"
              onClick={onFinish}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-extrabold transition active:scale-[0.98] ${
                shared
                  ? "pine-glow bg-pine font-display text-card"
                  : "border border-pine/30 bg-card font-display text-pine"
              }`}
            >
              <RotateCw size={17} strokeWidth={2.6} />
              Да, начать новый отчёт
            </button>

            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-2xl py-3.5 text-[15px] font-bold text-muted transition active:scale-[0.98]"
            >
              Отмена
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
