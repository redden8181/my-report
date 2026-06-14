import { useRef, useState } from 'react';
import { ArrowLeft, Download, Upload, Info, Plus, X } from 'lucide-react';
import { useStore, APP_VERSION, DEFAULT_CATEGORIES } from '../store';
import type { AppData } from '../types';

interface Props { onBack: () => void; }

export default function Settings({ onBack }: Props) {
  const { state, dispatch } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCat, setNewCat] = useState('');

  const handleExportData = () => {
    const data: AppData = { version: APP_VERSION, balance: state.balance, transactions: state.transactions, reports: state.reports, quickCategories: state.quickCategories };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `otchet_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
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
  };

  const moveCategory = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= state.quickCategories.length) return;
    const arr = [...state.quickCategories];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    dispatch({ type: 'SET_CATEGORIES', categories: arr });
  };

  const resetCategories = () => {
    dispatch({ type: 'SET_CATEGORIES', categories: DEFAULT_CATEGORIES });
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

        {/* Quick Categories */}
        <div>
          <h2 className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2 px-1">Быстрые категории</h2>
          <div className="bg-white/70 backdrop-blur-xl rounded-[16px] border border-white/80 overflow-hidden">
            {state.quickCategories.map((cat, i) => (
              <div key={cat} className="flex items-center gap-2 px-4 py-2.5 border-b border-[#c6c6c8]/20 last:border-0">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveCategory(i, -1)}
                    disabled={i === 0}
                    className="text-[#8e8e93] disabled:opacity-20 active:text-[#007aff] transition"
                  >
                    <svg width="12" height="7" viewBox="0 0 12 7" fill="none"><path d="M1 6L6 1L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button
                    onClick={() => moveCategory(i, 1)}
                    disabled={i === state.quickCategories.length - 1}
                    className="text-[#8e8e93] disabled:opacity-20 active:text-[#007aff] transition"
                  >
                    <svg width="12" height="7" viewBox="0 0 12 7" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <span className="flex-1 text-[15px] text-[#1c1c1e] font-medium">{cat}</span>
                <button onClick={() => removeCategory(cat)} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#ff3b30]/10 active:bg-[#ff3b30]/20 transition">
                  <X size={14} className="text-[#ff3b30]" />
                </button>
              </div>
            ))}

            {/* Add new */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-t border-[#c6c6c8]/20">
              <input
                type="text"
                placeholder="Новая категория..."
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); }}
                className="flex-1 text-[15px] bg-transparent placeholder:text-[#c7c7cc] text-[#1c1c1e] focus:outline-none"
              />
              <button
                onClick={addCategory}
                disabled={!newCat.trim() || state.quickCategories.includes(newCat.trim())}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#34c759] disabled:opacity-30 active:scale-95 transition"
              >
                <Plus size={14} className="text-white" />
              </button>
            </div>
          </div>

          {/* Reset */}
          <button onClick={resetCategories} className="mt-2 text-[13px] text-[#007aff] px-1 active:opacity-60 transition">
            Сбросить по умолчанию
          </button>
        </div>

        {/* Data */}
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

        {/* Version */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[16px] border border-white/80 overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-[#8e8e93] rounded-[10px] flex items-center justify-center shadow-sm"><Info size={20} className="text-white" /></div>
            <div><p className="font-semibold text-[#1c1c1e] text-[15px]">Версия</p><p className="text-[13px] text-[#8e8e93] font-mono">v{APP_VERSION}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
