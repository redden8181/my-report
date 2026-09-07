import { Component, type ReactNode } from "react";
import { CloudFog, Receipt } from "lucide-react";
import { STORAGE_KEY } from "./utils";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Защита от белого экрана: показывает сбой и позволяет восстановиться. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[Отчёт] Критическая ошибка:", error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-8 text-center text-ink">
        <span className="pine-glow flex h-14 w-14 items-center justify-center rounded-2xl bg-pine text-card">
          <Receipt size={26} strokeWidth={1.8} />
        </span>
        <div className="mt-5 font-display text-[22px] font-extrabold tracking-tight">
          Что-то пошло не так
        </div>
        <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-muted">
          Приложение столкнулось с ошибкой. Данные в памяти устройства не
          пострадали.
        </p>
        {error.message && (
          <p className="mt-4 flex max-w-[300px] items-start gap-2 break-words rounded-xl border border-edge bg-card px-3 py-2 text-left font-mono text-[10px] text-muted">
            <CloudFog size={13} className="mt-0.5 shrink-0" />
            {error.message.slice(0, 200)}
          </p>
        )}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="pine-glow mt-6 w-full max-w-[260px] rounded-2xl bg-pine py-4 font-display text-[15px] font-extrabold text-card transition active:scale-[0.98]"
        >
          Перезагрузить
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {
              /* noop */
            }
            window.location.reload();
          }}
          className="mt-2 w-full max-w-[260px] rounded-2xl py-3 text-[14px] font-bold text-burn transition active:scale-[0.98]"
        >
          Сбросить данные и перезагрузить
        </button>
      </div>
    );
  }
}
