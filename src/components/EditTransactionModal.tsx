import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Sheet, Switch } from "./ui";
import { fmtDayMonthYear, fmtTime, parseAmount } from "../utils";
import { useStore } from "../store";
import type { Transaction } from "../types";

const nfPlain = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

export function EditTransactionModal({
  tx,
  onClose,
}: {
  tx: Transaction | null;
  onClose: () => void;
}) {
  const { updateTransaction, deleteTransaction } = useStore();
  const [category, setCategory] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [hasReceipt, setHasReceipt] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // последний редактируемый объект — шторка не уезжает пустой
  const [lastTx, setLastTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (tx) {
      setLastTx(tx);
      setCategory(tx.category);
      setAmountStr(nfPlain.format(tx.amount));
      setHasReceipt(tx.hasReceipt);
      setConfirmDelete(false);
    }
  }, [tx]);

  const amount = parseAmount(amountStr);
  const canSave = !!tx && !!amount && category.trim().length > 0;

  const save = () => {
    if (!tx || !amount) return;
    updateTransaction(tx.id, {
      category: category.trim(),
      amount,
      hasReceipt,
    });
    onClose();
  };

  const remove = () => {
    if (!tx) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteTransaction(tx.id);
    onClose();
  };

  return (
    <Sheet open={!!tx} onClose={onClose} title="Редактировать операцию">
      {lastTx && (
        <div className="px-5 pb-2 pt-1">
          <div className="text-center font-mono text-[12px] font-medium text-muted">
            {fmtDayMonthYear(lastTx.date)} · {fmtTime(lastTx.date)}
          </div>

          <label className="mt-4 block">
            <span className="micro font-mono text-muted">Название</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Категория"
              className="mt-1.5 w-full rounded-xl border border-edge bg-tint px-3.5 py-3 text-[16px] font-medium text-ink outline-none transition focus:border-pine/50 focus:bg-card"
            />
          </label>

          <label className="mt-3 block">
            <span className="micro font-mono text-muted">Сумма</span>
            <div className="mt-1.5 flex items-center rounded-xl border border-edge bg-tint px-3.5 transition focus-within:border-pine/50 focus-within:bg-card">
              <input
                value={amountStr}
                onChange={(e) =>
                  setAmountStr(e.target.value.replace(/[^\d.,]/g, ""))
                }
                onKeyDown={(e) => e.key === "Enter" && canSave && save()}
                inputMode="decimal"
                placeholder="0"
                className="w-full bg-transparent py-3 font-mono text-[16px] font-bold text-ink outline-none"
              />
              <span className="font-mono text-[16px] font-bold text-pine">
                ₽
              </span>
            </div>
          </label>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-edge bg-tint px-3.5 py-3">
            <span className="text-[15px] font-medium text-ink">Чек есть</span>
            <Switch
              checked={hasReceipt}
              onChange={setHasReceipt}
              label="Чек есть"
            />
          </div>

          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className={`mt-5 w-full rounded-2xl py-4 font-display text-[16px] font-extrabold transition active:scale-[0.98] ${
              canSave ? "pine-glow bg-pine text-card" : "bg-tint text-muted"
            }`}
          >
            Сохранить
          </button>

          <button
            type="button"
            onClick={remove}
            className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold transition active:scale-[0.98] ${
              confirmDelete ? "bg-burn text-card" : "text-burn"
            }`}
          >
            <Trash2 size={16} strokeWidth={2.4} />
            {confirmDelete ? "Нажмите ещё раз — удалить" : "Удалить операцию"}
          </button>
        </div>
      )}
    </Sheet>
  );
}
