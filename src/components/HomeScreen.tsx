import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Plus,
  Receipt,
} from "lucide-react";
import { useStore } from "../store";
import type { Transaction } from "../types";
import {
  dayLabel,
  formatMoney,
  formatSigned,
  fmtTime,
  nfAmount,
  parseAmount,
} from "../utils";
import { SectionTitle, Switch, useToast } from "./ui";
import { TopupModal } from "./TopupModal";
import { EditTransactionModal } from "./EditTransactionModal";

/* ================= Баланс-герой ================= */

function BalanceHero({ onTopup }: { onTopup: () => void }) {
  const { data } = useStore();
  const negative = data.balance < 0;

  return (
    <section className="relative overflow-hidden px-5 pb-1 pt-4">
      {/* мягкая аура */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(150% 120% at 88% -20%, rgba(198,241,53,0.32) 0%, rgba(198,241,53,0) 58%)",
        }}
      />

      <div className="relative flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div
            className={`micro font-mono ${
              negative ? "text-burn" : "text-pine"
            }`}
          >
            {negative ? "Текущий долг" : "Текущий баланс"}
          </div>
          <div
            key={data.balance}
            className="pop-num mt-1 flex items-baseline gap-1.5"
          >
            <span
              className={`tnum min-w-0 truncate font-display text-[44px] font-extrabold leading-none tracking-tight ${
                negative ? "text-burn" : "text-ink"
              }`}
            >
              {nfAmount(data.balance)}
            </span>
            <span className="font-display text-[24px] font-extrabold text-pine">
              ₽
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onTopup}
          aria-label="Пополнить баланс"
          className="pine-glow flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pine text-card transition active:scale-90"
        >
          <Plus size={26} strokeWidth={3} />
        </button>
      </div>
    </section>
  );
}

/* ================= Форма расхода ================= */

function ExpenseForm() {
  const { data, addExpense } = useStore();
  const { show, node } = useToast();

  const [category, setCategory] = useState<string>("");
  const [customMode, setCustomMode] = useState(false);
  const [custom, setCustom] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [hasReceipt, setHasReceipt] = useState(false);
  const [shaking, setShaking] = useState(false);
  const shakeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(shakeTimer.current), []);

  const amount = parseAmount(amountStr);
  const effectiveCategory = customMode ? custom.trim() : category;
  const hints =
    !customMode && category ? (data.categoryHints[category] ?? []) : [];
  const canAdd = !!amount && effectiveCategory.length > 0;

  const nudge = () => {
    setShaking(false);
    requestAnimationFrame(() => {
      setShaking(true);
      window.clearTimeout(shakeTimer.current);
      shakeTimer.current = window.setTimeout(() => setShaking(false), 450);
    });
    show(
      effectiveCategory
        ? "Укажите сумму больше нуля"
        : "Выберите или введите категорию",
      "error"
    );
  };

  const submit = () => {
    if (!canAdd || !amount) {
      nudge();
      return;
    }
    addExpense(effectiveCategory, amount, hasReceipt);
    setAmountStr("");
    setHasReceipt(false);
    show(`− ${formatMoney(amount)} · ${effectiveCategory}`);
  };

  return (
    <div
      className={`panel mx-4 mt-3 rounded-[24px] p-4 ${shaking ? "shake" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="h-3 w-[3px] rounded-full bg-pine" />
        <span className="micro font-mono text-ink">Новый расход</span>
      </div>

      {/* 1. категории — сетка кнопок, всё видно сразу */}
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {data.quickCategories.map((c) => {
          const active = !customMode && category === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategory(c);
                setCustomMode(false);
              }}
              className={`min-w-0 rounded-xl border px-3 py-2.5 text-[13px] font-bold leading-tight transition active:scale-95 ${
                active
                  ? "border-transparent bg-pine text-card"
                  : "border-edge bg-tint text-ink"
              }`}
            >
              <span className="block truncate">{c}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setCustomMode((v) => !v)}
          className={`flex min-w-0 items-center justify-center gap-1 rounded-xl border border-dashed px-3 py-2.5 text-[13px] font-bold transition active:scale-95 ${
            customMode
              ? "border-transparent bg-pine text-card"
              : "border-muted/50 text-muted"
          }`}
        >
          <Plus size={13} strokeWidth={3} />
          Своя
        </button>
      </div>

      {customMode && (
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Название категории"
          autoFocus
          className="fade-up mt-2 w-full rounded-xl border border-edge bg-tint px-3.5 py-2.5 text-[16px] font-medium text-ink outline-none transition focus:border-pine/50 focus:bg-card"
        />
      )}

      {/* 2. сумма + чек */}
      <div className="mt-3 flex items-end gap-3 border-b-2 border-dashed border-edge pb-1.5 transition-colors focus-within:border-pine">
        <input
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value.replace(/[^\d.,]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          inputMode="decimal"
          placeholder="0"
          aria-label="Сумма расхода"
          className="tnum min-w-0 flex-1 bg-transparent font-mono text-[30px] font-bold tracking-tight text-ink outline-none"
        />
        <span className="pb-0.5 font-mono text-[18px] font-bold text-pine">
          ₽
        </span>
        <div className="flex shrink-0 items-center gap-2 pb-1 pl-1">
          <Receipt size={14} strokeWidth={2.2} className="text-muted" />
          <span className="text-[12px] font-medium text-muted">Чек</span>
          <Switch
            checked={hasReceipt}
            onChange={setHasReceipt}
            label="Чек есть"
          />
        </div>
      </div>

      {/* подсказки сумм */}
      {hints.length > 0 && (
        <div className="fade-up mt-2.5 flex flex-wrap gap-1.5">
          {hints.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setAmountStr(nfAmount(h))}
              className={`rounded-full border px-3 py-1.5 font-mono text-[12px] font-bold transition active:scale-95 ${
                amount === h
                  ? "border-transparent bg-pine text-card"
                  : "border-edge bg-tint text-ink"
              }`}
            >
              {nfAmount(h)}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        aria-disabled={!canAdd}
        className={`mt-3 w-full rounded-2xl py-3.5 font-display text-[16px] font-extrabold transition active:scale-[0.98] ${
          canAdd ? "pine-glow bg-pine text-card" : "bg-tint text-muted"
        }`}
      >
        {canAdd && amount
          ? `Добавить · ${formatMoney(amount)}`
          : "Добавить расход"}
      </button>
      {node}
    </div>
  );
}

/* ================= История ================= */

interface Group {
  label: string;
  items: Transaction[];
}

function groupByDay(txs: Transaction[]): Group[] {
  const groups: Group[] = [];
  const map = new Map<string, Group>();
  for (const t of [...txs].reverse()) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let g = map.get(key);
    if (!g) {
      g = { label: dayLabel(t.date), items: [] };
      map.set(key, g);
      groups.push(g);
    }
    g.items.push(t);
  }
  return groups;
}

function TxRow({
  tx,
  expanded,
  onToggle,
  onEdit,
}: {
  tx: Transaction;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const topup = tx.type === "topup";
  return (
    <div className={expanded ? "bg-tint/70" : ""}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-tint/70"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            topup ? "bg-income/10 text-income" : "bg-burn/10 text-burn"
          }`}
        >
          {topup ? (
            <ArrowDownLeft size={18} strokeWidth={2.4} />
          ) : (
            <ArrowUpRight size={18} strokeWidth={2.4} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold leading-tight text-ink">
            {tx.category}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-muted">
            {fmtTime(tx.date)}
            {tx.hasReceipt && (
              <span className="flex items-center gap-0.5 font-bold text-income">
                <Receipt size={11} strokeWidth={2.6} />
                чек
              </span>
            )}
          </span>
        </span>
        <span
          className={`shrink-0 font-mono text-[15px] font-bold ${
            topup ? "text-income" : "text-ink"
          }`}
        >
          {formatSigned(topup ? tx.amount : -tx.amount)}
        </span>
      </button>
      {expanded && (
        <div className="fade-up flex items-center justify-between gap-2 px-4 pb-3.5 pl-[68px]">
          <span className="font-mono text-[11px] text-muted">
            баланс после: {nfAmount(tx.balanceAfter)} ₽
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-full border border-pine/30 bg-card px-3.5 py-1.5 text-[12px] font-bold text-pine transition active:scale-95"
          >
            <Pencil size={12} strokeWidth={2.8} />
            Изменить
          </button>
        </div>
      )}
    </div>
  );
}

function History() {
  const { data } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const groups = useMemo(
    () => groupByDay(data.transactions),
    [data.transactions]
  );

  return (
    <div className="pb-2">
      <SectionTitle>История</SectionTitle>
      {groups.length === 0 ? (
        <div className="panel mx-4 rounded-[26px] px-6 py-12 text-center">
          <Receipt
            size={28}
            strokeWidth={1.4}
            className="mx-auto text-muted/50"
          />
          <div className="mt-3 text-[14px] font-semibold text-muted">
            Операций пока нет
          </div>
          <div className="mt-1 text-[12px] text-muted/70">
            Пополните баланс и добавьте первый расход
          </div>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.label} className="mb-4">
            <div className="flex items-center gap-2 px-5 pb-2 pt-1">
              <span className="h-2.5 w-[3px] rounded-full bg-pine/60" />
              <span className="micro font-mono text-muted">{g.label}</span>
            </div>
            <div className="panel mx-4 overflow-hidden rounded-[22px]">
              <div className="divide-y divide-dashed divide-edge">
                {g.items.map((tx) => (
                  <TxRow
                    key={tx.id}
                    tx={tx}
                    expanded={expandedId === tx.id}
                    onToggle={() =>
                      setExpandedId(expandedId === tx.id ? null : tx.id)
                    }
                    onEdit={() => setEditing(tx)}
                  />
                ))}
              </div>
            </div>
          </div>
        ))
      )}
      <EditTransactionModal tx={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

/* ================= Экран ================= */

export function HomeScreen() {
  const [topupOpen, setTopupOpen] = useState(false);

  return (
    <div className="fade-up">
      <BalanceHero onTopup={() => setTopupOpen(true)} />
      <ExpenseForm />
      <History />
      <TopupModal open={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  );
}
