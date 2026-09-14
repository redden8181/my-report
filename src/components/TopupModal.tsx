import { useEffect, useState, type RefObject } from "react";
import { CircleDollarSign } from "lucide-react";
import { Sheet } from "./ui";
import { formatMoney, parseAmount } from "../utils";
import { useStore } from "../store";

export function TopupModal({
  open,
  onClose,
  inputRef,
}: {
  open: boolean;
  onClose: () => void;
  /** Поле суммы. Родитель фокусирует его синхронно по тапу,
   *  иначе iOS не покажет клавиатуру сразу. */
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const { addTopup } = useStore();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) {
      setValue("");
      // подстраховка для браузеров, где синхронный фокус не сработал
      const t = window.setTimeout(() => {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
        }
      }, 340);
      return () => window.clearTimeout(t);
    }
    // закрыли — снимаем фокус, чтобы клавиатура ушла вместе со шторкой
    inputRef.current?.blur();
  }, [open, inputRef]);

  const amount = parseAmount(value);

  const confirm = () => {
    if (!amount) return;
    addTopup(amount);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Пополнить баланс" keepMounted>
      <div className="px-5 pb-2 pt-2">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pine/8 text-pine">
            <CircleDollarSign size={24} strokeWidth={1.8} />
          </div>
        </div>

        <div className="mt-3 text-center">
          <span className="micro font-mono text-muted">Сумма в рублях</span>
        </div>

        <div className="mt-1 flex items-baseline justify-center gap-2 py-3">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && confirm()}
            inputMode="decimal"
            placeholder="0"
            aria-label="Сумма пополнения"
            className="w-full max-w-[230px] bg-transparent text-center font-mono text-[52px] font-bold leading-none tracking-tight text-ink outline-none"
          />
          <span className="font-mono text-[24px] font-bold text-pine">₽</span>
        </div>

        <button
          type="button"
          onClick={confirm}
          disabled={!amount}
          className={`mt-4 w-full rounded-2xl py-4 font-display text-[16px] font-extrabold transition active:scale-[0.98] ${
            amount ? "pine-glow bg-pine text-card" : "bg-tint text-muted"
          }`}
        >
          Пополнить{amount ? ` на ${formatMoney(amount)}` : ""}
        </button>
      </div>
    </Sheet>
  );
}
