import { useState } from "react";
import { Archive, ChartNoAxesCombined, FileSpreadsheet, House, Settings2, Sparkles } from "lucide-react";
import { StoreProvider, useStore } from "./store";
import { HomeScreen } from "./components/HomeScreen";
import { ReportPreview } from "./components/ReportPreview";
import { ReportsHistory } from "./components/ReportsHistory";
import { Settings } from "./components/Settings";

type Tab = "home" | "report" | "archive" | "settings";
const TABS: { id: Tab; label: string; icon: typeof House; number: string }[] = [
  { id: "home", label: "Главная", icon: House, number: "01" },
  { id: "report", label: "Отчёт", icon: FileSpreadsheet, number: "02" },
  { id: "archive", label: "Архив", icon: Archive, number: "03" },
  { id: "settings", label: "Настройки", icon: Settings2, number: "04" },
];
function Header({tab}: {tab:Tab}) {
  const { data } = useStore();
  const current = TABS.find(t=>t.id===tab)!;
  return <header className="atelier-header sticky top-0 z-30">
    <div className="safe-t" />
    <div className="mx-auto flex max-w-[1140px] items-center justify-between gap-4 px-5 py-4 md:px-10">
      <div className="flex items-center gap-3">
        <span className="brand-mark"><ChartNoAxesCombined size={21} strokeWidth={2.2}/></span>
        <div><div className="brand-title">ФОРМА<span className="brand-period">.</span></div><div className="brand-subtitle">ФИНАНСОВЫЙ ЖУРНАЛ</div></div>
      </div>
      <div className="flex items-center gap-2"><span className="header-section">{current.number} / {current.label}</span><span className="header-count">{data.transactions.length} ОПЕРАЦИЙ</span></div>
    </div>
  </header>;
}
function Dock({tab,onChange}:{tab:Tab;onChange:(tab:Tab)=>void}) {
  return <nav className="atelier-dock no-callout fixed inset-x-0 bottom-0 z-40" aria-label="Основная навигация">
    <div className="mx-auto grid w-full max-w-[560px] grid-cols-4 gap-1 px-2 pb-[max(env(safe-area-inset-bottom),12px)] pt-2">
      {TABS.map(({id,label,icon:Icon,number})=><button key={id} type="button" aria-current={tab===id?"page":undefined} onClick={()=>onChange(id)} className={`atelier-tab ${tab===id?"atelier-tab-active":""}`}>
        <span className="atelier-tab-icon"><Icon size={19} strokeWidth={tab===id?2.4:1.8}/></span>
        <span className="atelier-tab-label">{label}</span><span className="atelier-tab-number">{number}</span>
      </button>)}
    </div>
  </nav>;
}
function AppShell() {
  const [tab,setTab]=useState<Tab>("home");
  return <div className="atelier-app relative min-h-dvh bg-paper text-ink">
    <Header tab={tab}/>
    <div className="atelier-layout mx-auto w-full max-w-[1140px] md:px-10">
      <aside className="atelier-rail hidden md:flex">
        <div className="rail-caption">РАБОЧЕЕ ПРОСТРАНСТВО</div>
        {TABS.map(({id,label,icon:Icon,number})=><button key={id} onClick={()=>setTab(id)} className={`rail-item ${tab===id?"rail-item-active":""}`}><span>{number}</span><Icon size={17}/><strong>{label}</strong></button>)}
        <div className="rail-foot"><Sparkles size={15}/> Создано для ежедневной работы</div>
      </aside>
      <main key={tab} className="atelier-main pb-[calc(114px+env(safe-area-inset-bottom))] md:pb-16">
        {tab==="home"&&<HomeScreen/>}
        {tab==="report"&&<ReportPreview/>}
        {tab==="archive"&&<ReportsHistory/>}
        {tab==="settings"&&<Settings/>}
      </main>
    </div>
    <Dock tab={tab} onChange={setTab}/>
  </div>;
}
export default function App(){return <StoreProvider><AppShell/></StoreProvider>}
