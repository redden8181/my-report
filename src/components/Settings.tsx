import { useRef,useState } from "react";
import { ArrowDown,ArrowUp,Download,Plus,Trash2,Upload } from "lucide-react";
import { useStore } from "../store";
import { shareJsonBackup } from "../exportExcel";
import { DEFAULT_CATEGORIES } from "../utils";
import { APP_VERSION } from "../types";
import { useToast } from "./ui";

export function Settings(){
  const {data,setCategories,setHints,importData}=useStore();
  const {show,node}=useToast();
  const [draft,setDraft]=useState("");
  const [hintDraft,setHintDraft]=useState<Record<string,string>>({});
  const [confirmImport,setConfirmImport]=useState<unknown|null>(null);
  const inputRef=useRef<HTMLInputElement>(null);
  const add=()=>{const name=draft.trim();if(!name||data.quickCategories.some(c=>c.toLowerCase()===name.toLowerCase()))return;setCategories([...data.quickCategories,name]);setDraft("")};
  const move=(i:number,offset:number)=>{const next=[...data.quickCategories];const j=i+offset;if(j<0||j>=next.length)return;[next[i],next[j]]=[next[j],next[i]];setCategories(next)};
  const readBackup=async(file?:File)=>{if(!file)return;try{const raw=JSON.parse(await file.text());if(!raw||typeof raw!=="object"||!Array.isArray(raw.transactions)||!Array.isArray(raw.reports)){show("Неверный формат резервной копии","error");return;}setConfirmImport(raw)}catch{show("Не удалось прочитать JSON","error")}};
  return <div className="settings-workspace">
    <div className="work-section-head"><span>04 / ПЕРСОНАЛИЗАЦИЯ</span><span>НАСТРОЙКИ</span></div>
    <h1 className="work-title">Мои категории</h1>
    <p className="archive-subtitle">Управляйте порядком категорий и быстрыми суммами. Изменения сразу появляются на главном экране.</p>
    <div className="settings-categories">{data.quickCategories.map((name,i)=><div className="settings-category" key={name}><div className="settings-category-head"><span className="settings-number">{String(i+1).padStart(2,"0")}</span><strong>{name}</strong><button disabled={i===0} aria-label={"Поднять "+name} onClick={()=>move(i,-1)}><ArrowUp size={16}/></button><button disabled={i===data.quickCategories.length-1} aria-label={"Опустить "+name} onClick={()=>move(i,1)}><ArrowDown size={16}/></button><button aria-label={"Удалить "+name} onClick={()=>{if(window.confirm("Удалить категорию «"+name+"» из быстрых кнопок? Сохранённые расходы останутся."))setCategories(data.quickCategories.filter(c=>c!==name))}}><Trash2 size={16}/></button></div><div className="settings-hints">{(data.categoryHints[name]??[]).map(h=><button key={h} title="Удалить подсказку" onClick={()=>setHints(name,(data.categoryHints[name]??[]).filter(v=>v!==h))}>{h} ₽ ×</button>)}<input inputMode="decimal" aria-label={"Новая сумма для "+name} placeholder="+ сумма" value={hintDraft[name]??""} onChange={e=>setHintDraft(p=>({...p,[name]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"){const n=Number((hintDraft[name]??"").replace(",","."));if(n>0&&Number.isFinite(n)){setHints(name,[...(data.categoryHints[name]??[]),n]);setHintDraft(p=>({...p,[name]:""}))}}}}/><button className="settings-add-hint" onClick={()=>{const n=Number((hintDraft[name]??"").replace(",","."));if(n>0&&Number.isFinite(n)){setHints(name,[...(data.categoryHints[name]??[]),n]);setHintDraft(p=>({...p,[name]:""}))}}}><Plus size={16}/></button></div></div>)}</div>
    <div className="settings-new"><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Новая категория"/><button onClick={add}><Plus size={18}/> Добавить</button></div>
    <section className="settings-backup"><div className="work-section-head"><span>ДАННЫЕ / РЕЗЕРВНАЯ КОПИЯ</span><span>JSON</span></div><h2>Ваши данные — под контролем</h2><p>Сохраните копию перед импортом. Импорт заменяет данные только этого приложения; основная версия находится по другому адресу.</p><div><button onClick={async()=>{try{const r=await shareJsonBackup(data);show(r==="cancelled"?"Отменено":"Копия подготовлена")}catch{show("Ошибка резервного копирования","error")}}}><Download size={18}/> Сохранить копию</button><button onClick={()=>inputRef.current?.click()}><Upload size={18}/> Импорт JSON</button></div><input ref={inputRef} type="file" accept=".json,application/json" className="hidden" onChange={e=>{void readBackup(e.target.files?.[0]);e.target.value=""}}/><p className="settings-version">Версия формата: {APP_VERSION}</p></section>
    <button className="settings-reset" onClick={()=>{if(window.confirm("Восстановить стандартные категории? Сохранённые операции не изменятся."))setCategories([...DEFAULT_CATEGORIES])}}>Восстановить стандартные категории</button>
    {confirmImport!==null&&<div className="report-confirm" role="dialog" aria-modal="true" aria-label="Подтверждение импорта"><div><h2>Заменить данные?</h2><p>Импорт заменит все операции, отчёты, категории и подсказки тестового приложения. Рекомендуем сначала сохранить резервную копию.</p><div><button onClick={()=>setConfirmImport(null)}>Отмена</button><button onClick={()=>{importData(confirmImport);setConfirmImport(null);show("Резервная копия импортирована")}}>Импортировать</button></div></div></div>}
    {node}
  </div>;
}
