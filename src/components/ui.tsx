import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/* ---------------- Sheet (нижняя шторка) ---------------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
  tall = false,
  keepMounted = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  tall?: boolean;
  /** Держать содержимое в DOM всегда — нужно, чтобы iOS мог
   *  синхронно сфокусировать поле и сразу показать клавиатуру. */
  keepMounted?: boolean;
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const rafA = useRef(0);
  const rafB = useRef(0);
  const closeTimer = useRef(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      rafA.current = requestAnimationFrame(() => {
        rafB.current = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(rafA.current);
        cancelAnimationFrame(rafB.current);
      };
    }
    setShown(false);
    closeTimer.current = window.setTimeout(() => setMounted(false), 320);
    return () => window.clearTimeout(closeTimer.current);
  }, [open]);

  useEffect(() => {
    if (!mounted || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted, open]);

  if (!mounted && !keepMounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 ${
        mounted ? "" : "pointer-events-none"
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[3px] transition-opacity duration-300 ${
          shown ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div
          className={`${
            tall ? "flex h-[88dvh] flex-col" : "max-h-[88dvh] overflow-y-auto"
          } rounded-t-[30px] border-x border-t border-edge bg-card pb-[max(env(safe-area-inset-bottom),20px)] shadow-[0_-16px_50px_rgba(18,24,20,0.25)]`}
        >
          <div className="sticky top-0 z-10 bg-card pt-2.5">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-ink/15" />
            {title !== undefined && (
              <div className="flex items-center justify-between px-5 pb-1 pt-3">
                <div className="font-display text-[18px] font-extrabold tracking-tight text-ink">
                  {title}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-tint text-muted transition active:scale-90"
                >
                  <X size={16} strokeWidth={2.4} />
                </button>
              </div>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------------- Toast ---------------- */

export function Toast({
  msg,
  kind = "ok",
}: {
  msg: string | null;
  kind?: "ok" | "error";
}) {
  if (!msg) return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-6">
      <div
        className={`toast-in dock-shadow flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-extrabold ${
          kind === "ok" ? "bg-pine text-card" : "bg-burn text-card"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            kind === "ok" ? "bg-volt" : "bg-card/80"
          }`}
        />
        {msg}
      </div>
    </div>,
    document.body
  );
}

export function useToast() {
  const [toast, setToast] = useState<{
    msg: string;
    kind: "ok" | "error";
  } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = useCallback((msg: string, kind: "ok" | "error" = "ok") => {
    window.clearTimeout(timer.current);
    setToast({ msg, kind });
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const node = toast ? <Toast msg={toast.msg} kind={toast.kind} /> : null;
  return { show, node };
}

/* ---------------- Switch ---------------- */

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[30px] w-[54px] shrink-0 rounded-full border transition-colors duration-200 ${
        checked ? "border-transparent bg-pine" : "border-edge bg-tint"
      }`}
    >
      <span
        className={`absolute left-[3px] top-[3px] h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgba(18,24,20,0.28)] transition-transform duration-200 ease-[cubic-bezier(.32,.72,0,1)] ${
          checked ? "translate-x-[24px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ---------------- Типографика ---------------- */

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 pb-3 pt-7">
      <span className="micro font-mono text-muted">{children}</span>
      <span className="h-px flex-1 bg-edge" />
    </div>
  );
}

export function ScreenHead({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="px-5 pb-1 pt-4">
      <div className="micro font-mono text-pine">{kicker}</div>
      <h1 className="mt-1.5 font-display text-[30px] font-extrabold tracking-tight text-ink">
        {title}
      </h1>
      {sub && <p className="mt-1 text-[13px] text-muted">{sub}</p>}
    </div>
  );
}
