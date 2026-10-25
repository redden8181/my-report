import { useMemo,useState } from "react";
import { CheckCircle2,FileSpreadsheet,RotateCcw,ReceiptText } from "lucide-react";
import { useStore } from "../store";
import type { Report } from "../types";
import { chronological,formatMoney,fmtDayMonthYear,round2 } from "../utils";
import { shareReportXlsx } from "../exportExcel";
import { useToast } from "./ui";

export function currentAsReport(txs:Report["transactions"]):Report|null{
  if(!txs.length)return null;
  const ordered=chronological(txs);
  return {id:"current",transactions:ordered,totalTopup:round2(ordered.filter(t=>t.type==="topup").reduce((s,t)=>s+t.amount,0)),totalExpense:round2(ordered.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0)),finalBalance:ordered[ordered.length-1].balanceAfter,startDate:ordered[0].date,endDate:new Date().toISOString()};
}
export function ReportPreview(){
  const {data,closeReport,updateTransaction}=useStore();
  const {show,node}=useToast();
  const [sharing,setSharing]=useState(false);
  const [confirm,setConfirm]=useState(false);
  const report=useMemo(()=>currentAsReport(data.transactions),[data.transactions]);
  const expenses=report?.transactions.filter(t=>t.type==="expense")??[];
  const missing=expenses.filter(t=>!t.hasReceipt).length;
  const exportFile=async()=>{if(!report||sharing)return;setSharing(true);try{const result=await shareReportXlsx(report);show(result==="shared"?"Excel отправлен":result==="downloaded"?"Excel сохранён":"Отправка отменена");}catch{show("Не удалось создать Excel","error");}finally{setSharing(false)}};
  const finish=()=>{if(!report)return;closeReport(true);setConfirm(false);show("Отчёт закрыт. Остаток перенесён в новый период.")};
  return <div className="report-workspace">
    <div className="work-section-head"><span>03 / ПОДГОТОВКА ДОКУМЕНТА</span><span>ОДИН АКТИВНЫЙ ПЕРИОД</span></div>
    <h1 className="work-title">Текущий отчёт</h1>
    <p className="archive-subtitle">Excel и завершение периода — независимые действия. Вы можете скачать файл, продолжить записи или начать новый отчёт.</p>
    <div className="report-summary"><div><small>ПОПОЛНЕНО</small><strong>{formatMoney(report?.totalTopup??0)}</strong></div><div><small>ПОТРАЧЕНО</small><strong>{formatMoney(report?.totalExpense??0)}</strong></div><div><small>ОСТАТОК</small><strong>{formatMoney(report?.finalBalance??0)}</strong></div></div>
    <div className="report-actions"><button className="report-export" disabled={!report||sharing} onClick={exportFile}><FileSpreadsheet size={22}/><span><strong>{sharing?"Формирую файл…":"Экспортировать Excel"}</strong><small>Без закрытия текущего отчёта</small></span></button><button className="report-close" disabled={!report} onClick={()=>setConfirm(true)}><RotateCcw size={22}/><span><strong>Начать новый отчёт</strong><small>Закрыть текущий и перенести остаток</small></span></button></div>
    <div className="work-section-head"><span>ПРОВЕРКА ЧЕКОВ</span><span>{missing} БЕЗ ЧЕКА</span></div>
    <p className="report-help">Проверьте наличие чеков перед отправкой. Изменения сразу отражаются в текущем отчёте.</p>
    <div className="report-receipts">{expenses.length===0?<p className="work-empty">В этом периоде пока нет расходов.</p>:expenses.map(t=><button type="button" key={t.id} onClick={()=>updateTransaction(t.id,{hasReceipt:!t.hasReceipt})} className="report-receipt"><ReceiptText size={18}/><span><strong>{t.category}</strong><small>{fmtDayMonthYear(t.date)} · {formatMoney(t.amount)}</small></span><span className={t.hasReceipt?"yes":"no"}>{t.hasReceipt?<><CheckCircle2 size={16}/> Чек есть</>:"Без чека"}</span></button>)}</div>
    {confirm&&<div className="report-confirm" role="dialog" aria-modal="true" aria-label="Подтверждение нового отчёта"><div><h2>Закрыть текущий отчёт?</h2><p>Все операции останутся в архиве. Остаток {formatMoney(report?.finalBalance??0)} перейдёт в следующий отчёт. Excel можно экспортировать и после закрытия.</p><div><button onClick={()=>setConfirm(false)}>Отмена</button><button onClick={finish}>Закрыть и начать новый</button></div></div></div>}
    {node}
  </div>;
}
