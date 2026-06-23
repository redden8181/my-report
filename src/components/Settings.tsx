import { useRef, useState } from 'react';
import { ArrowLeft, Download, Upload, Info, Plus, X } from 'lucide-react';
import { useStore, APP_VERSION, BUILD_DATE, DEFAULT_CATEGORIES, DEFAULT_HINTS } from '../store';
import type { AppData } from '../types';

interface Props { onBack: () => void; }

export default function Settings({ onBack }: Props) {
  const { state, dispatch } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCat, setNewCat] = useState('');
  const [editingHints, setEditingHints] = useState<string | null>(null);
  const [newHint, setNewHint] = useState('');

  const handleExportData = () => {
    const data: AppData = { version: APP_VERSION, balance: state.balance, transactions: state.transactions, reports: state.reports, quickCategories: state.quickCategories, categoryHints: state.categoryHints };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const fileName = `отчет_${dd}-${mm}-${yyyy}_${hh}-${min}.json`;
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fileName; a.click(); URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const data: AppData = JSON.parse(ev.target?.result as string); if (data.transactions && data.reports !== undefined) { dispatch({ type: 'LOAD_DATA', data }); alert('Данные успешно загружены!'); } else alert('Неверный формат файла'); } catch { alert('Ошибка при чтении файла'); } };
    reader.readAsText(file); if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addCategory = () => {
    const name = newCat.trim();
    if (name && !state.quickCategories.includes(name)) {
      dispatch({ type: 'SET_CATEGORIES', categories: [...state.quickCategories, name] });
      setNewCat('');
    }
  };

  const removeCategory = (cat: string) => {
    dispatch({ type: 'SET_CATEGORIES', categories: state.quickCategories.filter(c => c !== cat) });
    dispatch({ type: 'SET_HINTS', category: cat, hints: [] });
    if (editingHints === cat) setEditingHints(null);
  };

  const moveCategory = (idx: number, dir: -1 | 1) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= state.quickCategories.length) return;
    const arr = [...state.quickCategories];
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
    dispatch({ type: 'SET_CATEGORIES', categories: arr });
  };

  const resetAll = () => {
    dispatch({ type: 'SET_CATEGORIES', categories: DEFAULT_CATEGORIES });
    // Reset hints to defaults
    for (const cat of Object.keys(state.categoryHints)) {
      if (!DEFAULT_HINTS[cat]) dispatch({ type: 'SET_HINTS', category: cat, hints: [] });
    }
    for (const [cat, hints] of Object.entries(DEFAULT_HINTS)) {
      dispatch({ type: 'SET_HINTS', category: cat, hints });
    }
  };

  const addHint = (cat: string) => {
    const val = parseInt(newHint);
    if (val > 0) {
      const current = state.categoryHints[cat] || [];
      if (!current.includes(val)) {
        dispatch({ type: 'SET_HINTS', category: cat, hints: [...current, val].sort((a, b) => a - b) });
      }
      setNewHint('');
    }
  };

  const removeHint = (cat: string, val: number) => {
    const current = state.categoryHints[cat] || [];
    dispatch({ type: 'SET_HINTS', category: cat, hints: current.filter(h => h !== val) });
  };

  const formatBuildDate = () => {
    try {
      const d = new Date(BUILD_DATE);
      if (isNaN(d.getTime())) return BUILD_DATE;
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return BUILD_DATE; }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7]">
      <div className="sticky top-0 z-10 bg-[#f2f2f7]/70 backdrop-blur-2xl border-b border-white/60">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-2.5">
          <button onClick={onBack} className="flex items-center gap-1 text-[#007aff] active:opacity-60 transition"><ArrowLeft size={20} /><span className="text-[15px] font-medium">Назад</span></button>
          <h1 className="font-semibold text-[#1c1c1e] text-[15px]">Настройки</h1>
          <div className="w-16" />
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* ═══ Quick Categories ═══ */}
        <div>
          <h2 className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2 px-1">Быстрые категории</h2>
          <div className="bg-white/70 backdrop-blur-xl rounded-[16px] border border-white/80 overflow-hidden">
            {state.quickCategories.map((cat, i) => (
              <div key={cat}>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#c6c6c8]/20">
                  {/* Move arrows */}
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveCategory(i, -1)} disabled={i === 0} className="text-[#8e8e93] disabled:opacity-20 active:text-[#007aff] transition">
                      <svg width="12" height="7" viewBox="0 0 12 7" fill="none"><path d="M1 6L6 1L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button onClick={() => moveCategory(i, 1)} disabled={i === state.quickCategories.length - 1} className="text-[#8e8e93] disabled:opacity-20 active:text-[#007aff] transition">
                      <svg width="12" height="7" viewBox="0 0 12 7" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>

                  {/* Name + hints count */}
                  <button onClick={() => setEditingHints(editingHints === cat ? null : cat)} className="flex-1 text-left active:opacity-60 transition">
                    <span className="text-[15px] text-[#1c1c1e] font-medium">{cat}</span>
                    {state.categoryHints[cat] && state.categoryHints[cat].length > 0 && (
                      <span className="ml-2 text-[11px] text-[#8e8e93]">
                        ({state.categoryHints[cat].length} подсказ.)
                      </span>
                    )}
                  </button>

                  {/* Delete */}
                  <button onClick={() => removeCategory(cat)} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#ff3b30]/10 active:bg-[#ff3b30]/20 transition">
                    <X size={14} className="text-[#ff3b30]" />
                  </button>
                </div>

                {/* Hints editor for this category */}
                {editingHints === cat && (
                  <div className="px-4 py-3 bg-[#f2f2f7]/50 border-b border-[#c6c6c8]/20">
                    <p className="text-[11px] text-[#8e8e93] font-semibold uppercase tracking-wider mb-2">Подсказки сумм для «{cat}»</p>
                    
                    {/* Current hints */}
                    {state.categoryHints[cat] && state.categoryHints[cat].length > 0 ? (
                      <div className="flex gap-1.5 flex-wrap mb-2">
                        {state.categoryHints[cat].map(val => (
                          <div key={val} className="flex items-center gap-1 bg-white rounded-lg px-2.5 py-1.5 border border-[#c6c6c8]/30">
                            <span className="text-[13px] font-medium text-[#1c1c1e]">{val} ₽</span>
                            <button onClick={() => removeHint(cat, val)} className="active:opacity-60 transition">
                              <X size={12} className="text-[#ff3b30]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-[#c7c7cc] mb-2">Нет подсказок</p>
                    )}

                    {/* Add hint */}
                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="Сумма..."
                        value={newHint}
                        onChange={e => setNewHint(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addHint(cat); }}
                        className="flex-1 rounded-lg px-3 py-2 text-[14px] bg-white border border-[#c6c6c8]/30 text-[#1c1c1e] placeholder:text-[#c7c7cc] focus:outline-none focus:border-[#007aff]/50"
                      />
                      <button
                        onClick={() => addHint(cat)}
                        disabled={!newHint || parseInt(newHint) <= 0}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#34c759] disabled:opacity-30 active:scale-95 transition self-center"
                      >
                        <Plus size={14} className="text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add new category */}
            <div className="flex items-center gap-2 px-4 py-2.5">
              <input type="text" placeholder="Новая категория..." value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addCategory(); }} className="flex-1 text-[15px] bg-transparent placeholder:text-[#c7c7cc] text-[#1c1c1e] focus:outline-none" />
              <button onClick={addCategory} disabled={!newCat.trim() || state.quickCategories.includes(newCat.trim())} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#34c759] disabled:opacity-30 active:scale-95 transition">
                <Plus size={14} className="text-white" />
              </button>
            </div>
          </div>

          <button onClick={resetAll} className="mt-2 text-[13px] text-[#007aff] px-1 active:opacity-60 transition">
            Сбросить по умолчанию
          </button>
        </div>

        {/* ═══ Data ═══ */}
        <div>
          <h2 className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2 px-1">Данные</h2>
          <div className="bg-white/70 backdrop-blur-xl rounded-[16px] border border-white/80 overflow-hidden divide-y divide-[#c6c6c8]/25">
            <button onClick={handleExportData} className="w-full flex items-center gap-3 p-4 text-left active:bg-black/[0.03] transition">
              <div className="w-10 h-10 bg-[#34c759] rounded-[10px] flex items-center justify-center shadow-sm"><Download size={20} className="text-white" /></div>
              <div><p className="font-semibold text-[#1c1c1e] text-[15px]">Сохранить данные</p><p className="text-[12px] text-[#8e8e93] mt-0.5">Экспорт в JSON файл</p></div>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-4 text-left active:bg-black/[0.03] transition">
              <div className="w-10 h-10 bg-[#007aff] rounded-[10px] flex items-center justify-center shadow-sm"><Upload size={20} className="text-white" /></div>
              <div><p className="font-semibold text-[#1c1c1e] text-[15px]">Загрузить данные</p><p className="text-[12px] text-[#8e8e93] mt-0.5">Импорт из JSON файла</p></div>
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportData} className="hidden" />
        </div>

        {/* ═══ Version ═══ */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[16px] border border-white/80 overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-[#8e8e93] rounded-[10px] flex items-center justify-center shadow-sm"><Info size={20} className="text-white" /></div>
            <div>
              <p className="font-semibold text-[#1c1c1e] text-[15px]">Версия</p>
              <p className="text-[13px] text-[#8e8e93] font-mono">v{APP_VERSION}</p>
              <p className="text-[11px] text-[#c7c7cc] mt-0.5">Сборка: {formatBuildDate()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
