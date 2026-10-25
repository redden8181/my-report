import { useMemo, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarClock, Check, Pencil, Plus, ReceiptText, Wallet } from "lucide-react";
import { useStore } from "../store";
import type { Transaction } from "../types";
import { formatMoney, fmtTime, fmtDayMonthYear, parseAmount, toDateInputValue } from "../utils";
import { EditTransactionModal } from "./EditTransactionModal";
import { TopupModal } from "./TopupModal";
import { Switch, useToast } from "./ui";

function ExpenseComposer(){
  const {data,addExpense}=useStore();
  const {show,node}=useToast();
  const [category,setCategory]=useState("");
  const [other,setOther]=useState("");
  const [amount,setAmount]=useState("");
  const [comment,setComment]=useState("");
  const [receipt,setReceipt]=useState(false);
  const [date,setDate]=useState(()=>toDateInputValue(new Date()));
  const [time,setTime]=useState(()=>new Date().toTimeString().slice(0,5));
  const [dateOpen,setDateOpen]=useState(false);
  const categoryName=category==="__other"?other.trim():category;
  const hints=category==="__other"?[]:(data.categoryHints[category]??[]);
  const parsed=parseAmount(amount);
  const submit=()=>{
    if(!parsed||!categoryName){show("Выберите категорию и укажите сумму","error");return;}
    const selected=new Date(date+"T"+time+":00");
    if(Number.isNaN(selected.getTime())){show("Проверьте дату и время","error");return;}
    addExpense(categoryName,parsed,receipt,selected.toISOString(),comment.trim());
    show("Расход записан: "+formatMoney(parsed));
    setAmount("");setComment("");setReceipt(false);
    setDate(toDateInputValue(new Date()));setTime(new Date().toTimeString().slice(0,5));
  };
  return <section className="work-composer">
    <div className="work-section-head"><span>01 / НОВАЯ ЗАПИСЬ</span><span>РАСХОД</span></div>
    <h1 className="work-title">На что потратили?</h1>
    <div className="work-categories">
      {data.quickCategories.map(c=><button type="button" key={c} className={category===c?"chosen":""} onClick={()=>setCategory(c)}>{c}</button>)}
      <button type="button" className={category==="__other"?"chosen":""} onClick={()=>setCategory("__other")}><Plus size={15}/> Другая</button>
    </div>
    {category==="__other"&&<label className="work-field"><span>Название категории</span><input value={other} onChange={e=>setOther(e.target.value)} placeholder="Например, доставка"/></label>}
    <div className="work-amount">
      <label htmlFor="expense-amount">СУММА РАСХОДА</label>
      <div className="work-amount-row"><input id="expense-amount" inputMode="decimal" type="text" autoComplete="off" value={amount} onChange={e=>setAmount(e.target.value.replace(/[^\d.,]/g,""))} placeholder="0" aria-label="Сумма расхода"/><span>₽</span></div>
      {hints.length>0&&<div className="work-hints"><span>Частые суммы</span>{hints.map(h=><button type="button" key={h} className={parsed===h?"chosen":""} onClick={()=>setAmount(String(h).replace(".",","))}>{formatMoney(h)}</button>)}</div>}
    </div>
    <label className="work-field"><span>КОММЕНТАРИЙ <em>необязательно</em></span><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Уточнение к расходу"/></label>
    <div className="work-options">
      <button type="button" className="work-date-button" onClick={()=>setDateOpen(v=>!v)}><CalendarClock size={18}/><span>{date===toDateInputValue(new Date())?"Сегодня":date} · {time}</span><Pencil size={14}/></button>
      <div className="work-receipt"><ReceiptText size={18}/><span>Есть чек</span><Switch checked={receipt} onChange={setReceipt} label="Есть чек"/></div>
    </div>
    {dateOpen&&<div className="work-date-fields"><label>Дата<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Время<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label></div>}
    <button type="button" className="work-submit" onClick={submit} disabled={!parsed||!categoryName}><Check size={20}/> Записать расход {parsed?formatMoney(parsed):""}</button>
    {node}
  </section>;
}

export function HomeScreen(){
  const {data}=useStore();
  const [topupOpen,setTopupOpen]=useState(false);
  const inputRef=useRef<HTMLInputElement>(null);
  const [editing,setEditing]=useState<Transaction|null>(null);
  const transactions=useMemo(()=>[...data.transactions].reverse(),[data.transactions]);
  return <div className="work-screen">
    <section className="work-balance"><div><span className="work-eyebrow">АКТИВНЫЙ ОТЧЁТ / БАЛАНС</span><div className="work-balance-value">{formatMoney(data.balance)}</div><p>{transactions.length} операций в текущем периоде</p></div><button type="button" onClick={()=>{inputRef.current?.focus();setTopupOpen(true)}}><Wallet size={18}/> Пополнить</button></section>
    <ExpenseComposer/>
    <section className="work-history"><div className="work-section-head"><span>02 / ЖУРНАЛ</span><span>{transactions.length} ЗАПИСЕЙ</span></div><h2 className="work-title">Последние операции</h2>
      {transactions.length===0?<div className="work-empty">Пока нет записей. Выберите категорию и добавьте первый расход — начальный аванс необязателен.</div>:<div className="work-entries">{transactions.map(tx=><button type="button" key={tx.id} onClick={()=>setEditing(tx)} className="work-entry"><span className={tx.type==="topup"?"work-entry-icon income":"work-entry-icon"}>{tx.type==="topup"?<ArrowDownLeft size={19}/>:<ArrowUpRight size={19}/>}</span><span className="work-entry-name"><strong>{tx.category}</strong><small>{fmtDayMonthYear(tx.date)} · {fmtTime(tx.date)}{tx.hasReceipt?" · Чек":""}{tx.comment?" · "+tx.comment:""}</small></span><strong className="work-entry-amount">{tx.type==="topup"?"+":"−"}{formatMoney(tx.amount)}</strong><Pencil size={14}/></button>)}</div>}
    </section>
    <TopupModal open={topupOpen} onClose={()=>setTopupOpen(false)} inputRef={inputRef}/>
    <EditTransactionModal tx={editing} onClose={()=>setEditing(null)}/>
  </div>;
}
