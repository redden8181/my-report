import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Download,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useStore } from "../store";
import { BUILD_DATE, DEFAULT_CATEGORIES } from "../utils";
import { APP_VERSION } from "../types";
import { shareJsonBackup } from "../exportExcel";
import { ScreenHead, SectionTitle, Sheet, useToast } from "./ui";

/* ================= быстрые категории ================= */

function CategoriesEditor() {
  const { data, setCategories } = useStore();
  const [draft, setDraft] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);
  const list = data.quickCategories;

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  // нечего сортировать — выходим из режима порядка
  useEffect(() => {
    if (list.length < 2 && ordering) setOrdering(false);
  }, [list.length, ordering]);

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    if (list.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    setCategories([...list, name]);
    setDraft("");
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setCategories(next);
  };

  const remove = (i: number) => {
    setCategories(list.filter((_, idx) => idx !== i));
  };

  const reset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(
        () => setConfirmReset(false),
        2500
      );
      return;
    }
    setCategories([...DEFAULT_CATEGORIES]);
    setConfirmReset(false);
  };

  return (
    <div className="panel mx-4 overflow-hidden rounded-[24px]">
      {/* шапка со счётчиком и переключателем режима порядка */}
      <div className="flex items-center justify-between gap-2 border-b border-dashed border-edge px-4 py-3">
        <span className="micro font-mono text-muted">
          {list.length} шт.
        </span>
        <button
          type="button"
          onClick={() => setOrdering((v) => !v)}
          disabled={list.length < 2}
          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-bold transition active:scale-95 disabled:opacity-40 ${
            ordering
              ? "border-transparent bg-pine text-card"
              : "border-edge bg-tint text-ink"
          }`}
        >
          {ordering ? (
            <Check size={13} strokeWidth={3} />
          ) : (
            <ArrowUpDown size={13} strokeWidth={2.8} />
          )}
          {ordering ? "Готово" : "Порядок"}
        </button>
      </div>

      <div className="divide-y divide-dashed divide-edge">
        {list.map((c, i) => (
          <div key={c} className="flex items-center gap-2 px-3 py-2.5">
            {ordering && (
              <div className="fade-up flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Поднять ${c}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-tint text-ink transition active:scale-90 disabled:opacity-25"
                >
                  <ArrowUp size={16} strokeWidth={2.8} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === list.length - 1}
                  aria-label={`Опустить ${c}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-tint text-ink transition active:scale-90 disabled:opacity-25"
                >
                  <ArrowDown size={16} strokeWidth={2.8} />
                </button>
              </div>
            )}
            <div className="min-w-0 flex-1 truncate px-1.5 text-[15px] font-medium text-ink">
              {c}
            </div>
            {!ordering && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Удалить ${c}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted/60 transition active:scale-90 active:text-burn"
              >
                <Trash2 size={16} strokeWidth={2.2} />
              </button>
            )}
          </div>
        ))}
        {list.length === 0 && (
          <div className="px-4 py-5 text-center text-[13px] text-muted">
            Категории удалены — добавьте свои ниже
          </div>
        )}
      </div>

      {!ordering && (
        <>
          <div className="flex items-center gap-2 border-t border-dashed border-edge p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Новая категория"
              className="min-w-0 flex-1 rounded-xl border border-edge bg-tint px-3.5 py-3 text-[16px] text-ink outline-none transition focus:border-pine/50 focus:bg-card"
            />
            <button
              type="button"
              onClick={add}
              disabled={!draft.trim()}
              aria-label="Добавить категорию"
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition active:scale-95 ${
                draft.trim()
                  ? "pine-glow bg-pine text-card"
                  : "bg-tint text-muted"
              }`}
            >
              <Plus size={20} strokeWidth={2.8} />
            </button>
          </div>

          <button
            type="button"
            onClick={reset}
            className={`flex w-full items-center justify-center gap-2 border-t border-dashed border-edge py-3.5 text-[13px] font-bold transition ${
              confirmReset ? "text-burn" : "text-muted"
            }`}
          >
            <RotateCcw size={14} strokeWidth={2.6} />
            {confirmReset
              ? "Нажмите ещё раз для сброса"
              : "Сбросить по умолчанию"}
          </button>
        </>
      )}
    </div>
  );
}

/* ================= подсказки сумм ================= */

function HintsEditor() {
  const { data, setHints } = useStore();
  const cats = data.quickCategories;
  const [active, setActive] = useState<string>(cats[0] ?? "");
  const [draft, setDraft] = useState("");

  const currentCat = cats.includes(active) ? active : (cats[0] ?? null);
  const hints = currentCat ? (data.categoryHints[currentCat] ?? []) : [];

  const add = () => {
    if (!currentCat) return;
    const n = parseInt(draft, 10);
    setDraft("");
    if (!Number.isFinite(n) || n <= 0) return;
    setHints(currentCat, [...hints, n]);
  };

  const remove = (n: number) => {
    if (!currentCat) return;
    setHints(
      currentCat,
      hints.filter((h) => h !== n)
    );
  };

  if (cats.length === 0) return null;

  return (
    <div className="panel mx-4 rounded-[24px] p-4">
      <div className="grid grid-cols-2 gap-2">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={`min-w-0 rounded-xl border px-3 py-2.5 text-[13px] font-bold leading-tight transition active:scale-95 ${
              currentCat === c
                ? "border-transparent bg-pine text-card"
                : "border-edge bg-tint text-ink"
            }`}
          >
            <span className="block truncate">{c}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {hints.map((h) => (
          <span
            key={h}
            className="flex items-center gap-1 rounded-full bg-pine/8 py-1.5 pl-3 pr-1.5 font-mono text-[12px] font-bold text-pine"
          >
            {h}
            <button
              type="button"
              onClick={() => remove(h)}
              aria-label={`Удалить ${h}`}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-card text-muted transition active:scale-90"
            >
              <X size={11} strokeWidth={3} />
            </button>
          </span>
        ))}
        {hints.length === 0 && (
          <span className="text-[12px] text-muted">
            Подсказок нет — суммы будут показаны при добавлении расхода
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && add()}
          inputMode="numeric"
          placeholder="Сумма, например 500"
          className="min-w-0 flex-1 rounded-xl border border-edge bg-tint px-3.5 py-3 font-mono text-[16px] text-ink outline-none transition focus:border-pine/50 focus:bg-card"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          aria-label="Добавить подсказку"
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition active:scale-95 ${
            draft.trim() ? "pine-glow bg-pine text-card" : "bg-tint text-muted"
          }`}
        >
          <Plus size={20} strokeWidth={2.8} />
        </button>
      </div>
    </div>
  );
}

/* ================= данные (бэкап) ================= */

interface PendingImport {
  raw: unknown;
  txCount: number;
  reportCount: number;
}

function DataSection() {
  const { data, importData } = useStore();
  const { show, node } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);

  const exportJson = async () => {
    try {
      const res = await shareJsonBackup(data);
      if (res === "shared") show("Бэкап отправлен");
      else if (res === "downloaded") show("Бэкап сохранён в файлы");
      else show("Отправка отменена");
    } catch {
      show("Не удалось экспортировать", "error");
    }
  };

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      if (!raw || typeof raw !== "object" || !("transactions" in raw)) {
        throw new Error("bad");
      }
      const r = raw as Record<string, unknown>;
      setPending({
        raw,
        txCount: Array.isArray(r.transactions) ? r.transactions.length : 0,
        reportCount: Array.isArray(r.reports) ? r.reports.length : 0,
      });
    } catch {
      show("Файл не похож на бэкап «Отчёта»", "error");
    }
  };

  const applyImport = () => {
    if (!pending) return;
    importData(pending.raw);
    setPending(null);
    show("Данные восстановлены");
  };

  return (
    <div className="panel mx-4 overflow-hidden rounded-[24px]">
      <button
        type="button"
        onClick={exportJson}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:bg-tint/70"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine/8 text-pine">
          <Download size={18} strokeWidth={2.2} />
        </span>
        <span className="flex-1">
          <span className="block text-[14px] font-bold text-ink">
            Экспорт данных
          </span>
          <span className="mt-0.5 block text-[11px] text-muted">
            JSON-бэкап: баланс, операции, отчёты, настройки
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex w-full items-center gap-3 border-t border-dashed border-edge px-4 py-4 text-left transition active:bg-tint/70"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine/8 text-pine">
          <Upload size={18} strokeWidth={2.2} />
        </span>
        <span className="flex-1">
          <span className="block text-[14px] font-bold text-ink">
            Импорт данных
          </span>
          <span className="mt-0.5 block text-[11px] text-muted">
            Восстановление из JSON-бэкапа
          </span>
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          void onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <Sheet
        open={!!pending}
        onClose={() => setPending(null)}
        title="Восстановить бэкап?"
      >
        {pending && (
          <div className="px-5 pb-2 pt-1">
            <div className="rounded-2xl border border-edge bg-tint p-4 text-[13px] leading-relaxed text-muted">
              Из файла будет загружено:{" "}
              <span className="font-mono text-[12px] font-bold text-ink">
                {pending.txCount} операций, {pending.reportCount} отчётов
              </span>
              .<br />
              Текущие данные на устройстве будут заменены.
            </div>
            <button
              type="button"
              onClick={applyImport}
              className="pine-glow mt-4 w-full rounded-2xl bg-pine py-4 font-display text-[15px] font-extrabold text-card transition active:scale-[0.98]"
            >
              Восстановить
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="mt-2 w-full rounded-2xl py-3 text-[14px] font-medium text-muted"
            >
              Отмена
            </button>
          </div>
        )}
      </Sheet>
      {node}
    </div>
  );
}

/* ================= экран ================= */

export function Settings() {
  return (
    <div className="fade-up pb-2">
      <ScreenHead
        kicker="Управление"
        title="Настройки"
        sub="Категории, подсказки и резервные копии"
      />

      <SectionTitle>Быстрые категории</SectionTitle>
      <CategoriesEditor />

      <SectionTitle>Подсказки сумм</SectionTitle>
      <HintsEditor />

      <SectionTitle>Данные</SectionTitle>
      <DataSection />

      <div className="mt-9 px-5 text-center">
        <div className="font-mono text-[11px] font-bold text-muted">
          ОТЧЁТ · v{APP_VERSION} · сборка {BUILD_DATE}
        </div>
        <div className="mt-1 text-[11px] text-muted/70">
          Все данные хранятся локально на этом устройстве
        </div>
      </div>
    </div>
  );
}
