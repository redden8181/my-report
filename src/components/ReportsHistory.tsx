import { useMemo, useState } from "react";
import { ArrowLeft, FileSpreadsheet, Search, X } from "lucide-react";
import { useStore } from "../store";
import type { Report,Transaction } from "../types";
import { formatMoney,fmtDayMonthYear,fmtTime,reportTitle,txMatchesQuery,toDateInputValue,parseAmount } from "../utils";
import { shareReportXlsx } from "../exportExcel";
import { useToast } from "./ui";

function ArchiveEditor({report,tx,onClose}:{report:Report;tx:Transaction;onClose:()=>void}){
  const {updateArchivedTransaction}=useStore();
  const [category,setCategory]=useState(tx.category);
  const [amount,setAmount]=useState(String(tx.amount));
  const [comment,setComment]=useState(tx.comment??"");
  const [receipt,setReceipt]=useState(tx.hasReceipt);
  const [date,setDate]=useState(toDateInputValue(new Date(tx.date)));
  const [time,setTime]=useState(new Date(tx.date).toTimeString().slice(0,5));
  const save=()=>{
    const n=parseAmount(amount),d=new Date(date+"T"+time+":00");
    if(!n||!category.trim()||Number.isNaN(d.getTime()))return;
    updateArchivedTransaction(report.id,tx.id,{category:category.trim(),amount:n,comment:comment.trim(),hasReceipt:receipt,date:d.toISOString()});onClose();
  };
  return <div className="archive-edit"><h3>Исправить запись</h3><p>После изменения нужно повторно экспортировать Excel.</p><label>Категория<input value={category} onChange={e=>setCategory(e.target.value)}/></label><label>Сумма<input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Комментарий<input value={comment} onChange={e=>setComment(e.target.value)}/></label><div className="archive-edit-grid"><label>Дата<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Время<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label></div><label className="archive-check"><input type="checkbox" checked={receipt} onChange={e=>setReceipt(e.target.checked)}/> Есть чек</label><div className="archive-actions"><button onClick={onClose}>Отмена</button><button className="primary" onClick={save}>Сохранить</button></div></div>;
}
export function ReportsHistory({initialSearch=false}:{initialSearch?:boolean}){
  const {data}=useStore();
  const {show,node}=useToast();
  const [query,setQuery]=useState("");
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [sharing,setSharing]=useState(false);
  const selected=data.reports.find(r=>r.id===selectedId)??null;
  const editing=selected?.transactions.find(t=>t.id===editingId)??null;
  const matches=useMemo(()=>{
    if(!query.trim())return [];
    const all=[...data.reports.map(r=>({report:r,active:false})),{report:{id:"active",transactions:data.transactions,startDate:data.transactions[0]?.date??new Date().toISOString(),endDate:new Date().toISOString(),totalTopup:0,totalExpense:0,finalBalance:data.balance},active:true}];
    return all.flatMap(({report,active})=>report.transactions.filter(tx=>txMatchesQuery(tx,query)).map(tx=>({report,tx,active}))).sort((a,b)=>b.tx.date.localeCompare(a.tx.date));
  },[query,data.reports,data.transactions,data.balance]);
  const exportReport=async(report:Report)=>{if(sharing)return;setSharing(true);try{const status=await shareReportXlsx(report);show(status==="shared"?"Excel отправлен":status==="downloaded"?"Excel сохранён":"Отправка отменена");}catch{show("Ошибка экспорта Excel","error");}finally{setSharing(false)}};
  return <div className="archive-screen">
    <div className="work-section-head"><span>{initialSearch?"ПОИСК / ВСЕ ПЕРИОДЫ":"АРХИВ / ЗАКРЫТЫЕ ПЕРИОДЫ"}</span><span>{data.reports.length} ОТЧЁТОВ</span></div>
    <h1 className="work-title">{initialSearch?"Найти расход":"Архив отчётов"}</h1>
    <p className="archive-subtitle">{initialSearch?"Поиск в текущем отчёте и за всю историю":"Завершённые периоды доступны для просмотра, исправления и повторного экспорта."}</p>
    <div className="archive-search"><Search size={20}/><input type="search" value={query} onChange={e=>{setQuery(e.target.value);setSelectedId(null)}} placeholder="Сумма, дата, категория или комментарий" aria-label="Поиск расходов"/>{query&&<button onClick={()=>setQuery("")} aria-label="Очистить поиск"><X size={18}/></button>}</div>
    {query.trim()?<div className="archive-results"><div className="work-section-head"><span>СОВПАДЕНИЯ</span><span>{matches.length}</span></div>{matches.length===0?<p className="work-empty">Совпадений нет. Попробуйте другую сумму, дату или категорию.</p>:matches.map(({report,tx,active})=><button className="archive-hit" key={report.id+tx.id} onClick={()=>!active&&setSelectedId(report.id)}><span><strong>{tx.category}</strong><small>{active?"Текущий отчёт":reportTitle(report.startDate,report.endDate)} · {fmtDayMonthYear(tx.date)} · {fmtTime(tx.date)}{tx.comment?" · "+tx.comment:""}</small></span><b>{formatMoney(tx.amount)}</b></button>)}</div>:!selected?<div className="archive-list">{data.reports.length===0?<p className="work-empty">Архив пока пуст. Завершённые отчёты появятся здесь.</p>:data.reports.map((r,i)=><button className="archive-card" key={r.id} onClick={()=>setSelectedId(r.id)}><span className="archive-card-num">{String(data.reports.length-i).padStart(2,"0")}</span><span><strong>{reportTitle(r.startDate,r.endDate)}</strong><small>{r.transactions.length} операций · расходы {formatMoney(r.totalExpense)}</small></span><span className="archive-card-arrow">↗</span></button>)}</div>:<section className="archive-detail"><button className="archive-back" onClick={()=>setSelectedId(null)}><ArrowLeft size={18}/> Все отчёты</button><h2>{reportTitle(selected.startDate,selected.endDate)}</h2><div className="archive-detail-stats"><div><small>Расходы</small><strong>{formatMoney(selected.totalExpense)}</strong></div><div><small>Остаток</small><strong>{formatMoney(selected.finalBalance)}</strong></div></div><button className="archive-export" onClick={()=>exportReport(selected)} disabled={sharing}><FileSpreadsheet size={19}/>{sharing?"Готовлю файл…":"Повторно экспортировать Excel"}</button><div className="work-section-head"><span>ОПЕРАЦИИ</span><span>{selected.transactions.length}</span></div>{[...selected.transactions].reverse().map(tx=><button key={tx.id} className="archive-hit" onClick={()=>setEditingId(tx.id)}><span><strong>{tx.category}</strong><small>{fmtDayMonthYear(tx.date)} · {fmtTime(tx.date)}{tx.hasReceipt?" · чек":""}{tx.comment?" · "+tx.comment:""}</small></span><b>{tx.type==="expense"?"−":"+"}{formatMoney(tx.amount)}</b></button>)}{editing&&<ArchiveEditor key={editing.id} report={selected} tx={editing} onClose={()=>setEditingId(null)}/>}</section>}
    {node}
  </div>;
}
