import { useState } from "react";
import {
  Archive,
  FileSpreadsheet,
  Receipt,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { StoreProvider, useStore } from "./store";
import { HomeScreen } from "./components/HomeScreen";
import { ReportPreview } from "./components/ReportPreview";
import { ReportsHistory } from "./components/ReportsHistory";
import { Settings } from "./components/Settings";

type Tab = "home" | "report" | "archive" | "settings";

const TABS: { id: Tab; label: string; icon: typeof Wallet }[] = [
  { id: "home", label: "Главная", icon: Wallet },
  { id: "report", label: "Отчёт", icon: FileSpreadsheet },
  { id: "archive", label: "Архив", icon: Archive },
  { id: "settings", label: "Ещё", icon: SlidersHorizontal },
];

function Header() {
  const { data } = useStore();

  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-paper/85 backdrop-blur-xl">
      <div className="safe-t" />
      <div className="flex items-center justify-between px-5 pb-2.5 pt-2">
        <div className="flex items-center gap-2.5">
          <span className="pine-glow flex h-8 w-8 items-center justify-center rounded-xl bg-pine text-card">
            <Receipt size={17} strokeWidth={2.2} />
          </span>
          <span className="font-display text-[18px] font-extrabold uppercase tracking-tight text-ink">
            Отчёт
          </span>
        </div>
        <span className="font-mono text-[11px] font-bold text-muted">
          {data.transactions.length} оп.
        </span>
      </div>
    </header>
  );
}

function Dock({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="no-callout pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[max(env(safe-area-inset-bottom),10px)]">
      <div className="mx-auto w-full max-w-[400px] px-3">
        <div className="dock-shadow pointer-events-auto grid grid-cols-4 gap-1 rounded-full border border-edge bg-card/92 p-1.5 backdrop-blur-xl">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                className={`flex flex-col items-center gap-0.5 rounded-full py-1.5 transition-all duration-200 active:scale-95 ${
                  active ? "bg-pine" : "bg-transparent"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.9}
                  className={active ? "text-card" : "text-muted"}
                />
                <span
                  className={`text-[10px] font-bold leading-none ${
                    active ? "text-card" : "text-muted"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function AppShell() {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <div className="relative min-h-dvh bg-paper text-ink">
      {/* зерно поверх интерфейса */}
      <div
        aria-hidden
        className="noise pointer-events-none fixed inset-0 z-[65]"
      />

      <div className="dotgrid relative mx-auto min-h-dvh w-full max-w-[430px] sm:border-x sm:border-edge">
        <Header />

        <main
          key={tab}
          className="pb-[calc(108px+env(safe-area-inset-bottom))] pt-1"
        >
          {tab === "home" && <HomeScreen />}
          {tab === "report" && <ReportPreview />}
          {tab === "archive" && <ReportsHistory />}
          {tab === "settings" && <Settings />}
        </main>
      </div>

      <Dock tab={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
