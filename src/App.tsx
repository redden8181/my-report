import { useState } from "react";
import { Archive, Search, SlidersHorizontal, WalletCards } from "lucide-react";
import { StoreProvider } from "./store";
import { HomeScreen } from "./components/HomeScreen";
import { ReportsHistory } from "./components/ReportsHistory";
import { Settings } from "./components/Settings";
import { ReportPreview } from "./components/ReportPreview";

type Tab = "work" | "search" | "archive" | "settings" | "report";
const NAV: {id:Tab;label:string;icon:typeof Archive}[] = [
  {id:"work",label:"Работа",icon:WalletCards},
  {id:"search",label:"Поиск",icon:Search},
  {id:"archive",label:"Архив",icon:Archive},
  {id:"settings",label:"Настройки",icon:SlidersHorizontal},
];
function Shell() {
  const [tab,setTab]=useState<Tab>("work");
  return <div className="folio-shell">
    <header className="folio-header">
      <button type="button" className="folio-identity" onClick={()=>setTab("work")} aria-label="Открыть текущий отчёт">
        <span className="folio-symbol">Р<span>.</span></span>
        <span className="folio-brand">РАСХОДЫ <small>Личный журнал</small></span>
      </button>
      <button type="button" className="folio-report-link" onClick={()=>setTab(tab==="report"?"work":"report")}>{tab==="report"?"Вернуться к работе":"Текущий отчёт ↗"}</button>
    </header>
    <div className="folio-frame">
      <aside className="folio-sidebar">
        <div className="folio-sidebar-title">РАБОЧЕЕ МЕСТО</div>
        {NAV.map(({id,label,icon:Icon})=><button key={id} className={tab===id?"folio-nav active":"folio-nav"} onClick={()=>setTab(id)}><Icon size={19}/>{label}</button>)}
        <button className={tab==="report"?"folio-nav active":"folio-nav"} onClick={()=>setTab("report")}>↗ Сформировать отчёт</button>
        <div className="folio-sidebar-note">Сначала запись. Затем проверка. Потом Excel.</div>
      </aside>
      <main className="folio-content" key={tab}>
        {tab==="work"&&<HomeScreen/>}
        {tab==="search"&&<ReportsHistory initialSearch/>}
        {tab==="archive"&&<ReportsHistory/>}
        {tab==="settings"&&<Settings/>}
        {tab==="report"&&<ReportPreview/>}
      </main>
    </div>
    <nav className="folio-bottom" aria-label="Навигация">
      {NAV.map(({id,label,icon:Icon})=><button type="button" key={id} onClick={()=>setTab(id)} className={tab===id?"selected":""} aria-current={tab===id?"page":undefined}><Icon size={21}/><span>{label}</span></button>)}
    </nav>
  </div>;
}
export default function App(){return <StoreProvider><Shell/></StoreProvider>;}
