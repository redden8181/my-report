import { useState, useMemo } from 'react';
import { ArrowLeft, Search, Share, ChevronRight, X } from 'lucide-react';
import type { Report, Transaction } from '../types';
import { shareReport } from '../exportExcel';
import ReportPreview from './ReportPreview';

interface Props { reports: Report[]; currentTransactions: Transaction[]; currentBalance: number; onBack: () => void; }

function formatDate(iso: string) { const d = new Date(iso); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`; }
function formatMoney(n: number) { return n.toLocaleString('ru-RU') + ' ₽'; }

interface SearchResult { transaction: Transaction; report: Report; }

export default function ReportsHistory({ reports, currentTransactions, currentBalance, onBack }: Props) {
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [viewingCurrent, setViewingCurrent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const searchResults = useMemo<SearchResult[]>(() => {
    const q = searchQuery.trim().toLowerCase(); if (!q) return [];
    const terms = q.split(/\s+/);
    const results: SearchResult[] = [];
    for (const report of reports) for (const t of report.transactions) {
      const text = `${t.category.toLowerCase()} ${t.amount} ${formatDate(t.date)}`;
      if (terms.every(term => text.includes(term))) results.push({ transaction: t, report });
    }
    return results;
  }, [searchQuery, reports]);

  if (viewingCurrent) {
    const totalTopup = currentTransactions.filter(t => t.type === 'topup').reduce((s, t) => s + t.amount, 0);
    const totalExpense = currentTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const dates = currentTransactions.map(t => t.date);
    return <ReportPreview transactions={currentTransactions} totalTopup={totalTopup} totalExpense={totalExpense} finalBalance={currentBalance} startDate={dates[dates.length - 1] || new Date().toISOString()} endDate={dates[0] || new Date().toISOString()} onBack={() => setViewingCurrent(false)} />;
  }
  if (viewingReport) return <ReportPreview transactions={viewingReport.transactions} totalTopup={viewingReport.totalTopup} totalExpense={viewingReport.totalExpense} finalBalance={viewingReport.finalBalance} startDate={viewingReport.startDate} endDate={viewingReport.endDate} onBack={() => setViewingReport(null)} />;

  return (
    <div className="min-h-screen bg-[#f2f2f7]">
      <div className="sticky top-0 z-10 bg-[#f2f2f7]/70 backdrop-blur-2xl border-b border-white/60">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-2.5">
          <button onClick={onBack} className="flex items-center gap-1 text-[#007aff] active:opacity-60 transition"><ArrowLeft size={20} /><span className="text-[15px] font-medium">Назад</span></button>
          <h1 className="font-semibold text-[#1c1c1e] text-[15px]">Отчёты</h1>
          {reports.length > 0 ? <button onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); }} className="p-2.5 rounded-full active:bg-black/5 transition">{showSearch ? <X size={18} className="text-[#007aff]" /> : <Search size={18} className="text-[#007aff]" />}</button> : <div className="w-10" />}
        </div>
        {showSearch && <div className="max-w-lg mx-auto px-4 pb-3"><input type="text" placeholder="Поиск по всем отчётам..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full rounded-2xl px-4 py-2.5 text-[15px] bg-[#e5e5ea]/50 placeholder:text-[#8e8e93] text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 border border-white/50" autoFocus /></div>}
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {showSearch && searchQuery.trim() && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#8e8e93] font-semibold mb-2 px-1">Результаты ({searchResults.length})</p>
            {searchResults.length === 0 ? <div className="text-center py-10 bg-white/70 backdrop-blur-xl rounded-[16px] border border-white/80"><p className="text-[#8e8e93]">Ничего не найдено</p></div> : (
              <div className="bg-white/70 backdrop-blur-xl rounded-[16px] border border-white/80 overflow-hidden divide-y divide-[#c6c6c8]/25">
                {searchResults.map(({ transaction: t, report }) => (
                  <button key={`${report.id}-${t.id}`} onClick={() => { setViewingReport(report); setShowSearch(false); setSearchQuery(''); }} className="w-full px-4 py-3 text-left active:bg-black/[0.03] transition">
                    <div className="flex justify-between items-center">
                      <div><p className="text-[15px] font-medium text-[#1c1c1e]">{t.category}</p><p className="text-[11px] text-[#8e8e93] mt-0.5">{formatDate(t.date)} • Отчёт: {formatDate(report.startDate)}—{formatDate(report.endDate)}</p></div>
                      <div className="flex items-center gap-2"><span className={`text-[15px] font-semibold ${t.type === 'topup' ? 'text-[#34c759]' : 'text-[#ff2d55]'}`}>{t.type === 'topup' ? '+' : '−'}{formatMoney(t.amount)}</span><ChevronRight size={14} className="text-[#c7c7cc]" /></div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {(!showSearch || !searchQuery.trim()) && (<>
          {currentTransactions.length > 0 && (
            <button onClick={() => setViewingCurrent(true)} className="w-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-[16px] p-4 text-left active:bg-white/50 transition">
              <div className="flex justify-between items-center"><div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#ff2d55] rounded-full animate-pulse" /><p className="font-bold text-[#1c1c1e] text-[15px]">Текущий период</p></div><p className="text-[12px] text-[#8e8e93] mt-1">{currentTransactions.length} операций • Баланс: {formatMoney(currentBalance)}</p></div><ChevronRight size={18} className="text-[#c7c7cc]" /></div>
            </button>
          )}
          {reports.length === 0 && currentTransactions.length === 0 && <div className="text-center py-16"><p className="text-4xl mb-2">📋</p><p className="text-[#8e8e93] font-medium">Нет отчётов</p></div>}
          {reports.length > 0 && (
            <div className="bg-white/70 backdrop-blur-xl rounded-[16px] border border-white/80 overflow-hidden divide-y divide-[#c6c6c8]/25">
              {reports.map(report => (
                <div key={report.id} className="flex items-center">
                  <button onClick={() => setViewingReport(report)} className="flex-1 p-4 text-left active:bg-black/[0.03] transition">
                    <p className="font-semibold text-[#1c1c1e] text-[14px]">{formatDate(report.startDate)} — {formatDate(report.endDate)}</p>
                    <p className="text-[12px] text-[#8e8e93] mt-0.5">{report.transactions.length} операций</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[11px] font-semibold text-[#34c759]">+{formatMoney(report.totalTopup)}</span>
                      <span className="text-[11px] font-semibold text-[#ff2d55]">−{formatMoney(report.totalExpense)}</span>
                      <span className={`text-[11px] font-bold ${report.finalBalance >= 0 ? 'text-[#1c1c1e]' : 'text-[#ff2d55]'}`}>= {formatMoney(report.finalBalance)}</span>
                    </div>
                  </button>
                  <button onClick={() => shareReport(report.transactions, report.totalTopup, report.totalExpense, report.finalBalance, report.startDate, report.endDate)} className="p-4 active:bg-black/5 transition"><Share size={15} className="text-[#007aff]" /></button>
                </div>
              ))}
            </div>
          )}
        </>)}
      </div>
    </div>
  );
}
