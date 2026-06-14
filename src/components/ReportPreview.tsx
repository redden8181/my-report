import { ArrowLeft, Share } from 'lucide-react';
import type { Transaction } from '../types';
import { shareReport } from '../exportExcel';

interface Props { transactions: Transaction[]; totalTopup: number; totalExpense: number; finalBalance: number; startDate: string; endDate: string; onBack: () => void; }

function formatDate(iso: string) { const d = new Date(iso); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`; }
function formatMoney(n: number) { return n.toLocaleString('ru-RU') + ' ₽'; }

export default function ReportPreview({ transactions, totalTopup, totalExpense, finalBalance, startDate, endDate, onBack }: Props) {
  const sorted = [...transactions].reverse();

  return (
    <div className="min-h-screen bg-[#f2f2f7]">
      <div className="sticky top-0 z-10 bg-[#f2f2f7]/70 backdrop-blur-2xl border-b border-white/60">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-2.5">
          <button onClick={onBack} className="flex items-center gap-1 text-[#007aff] active:opacity-60 transition"><ArrowLeft size={20} /><span className="text-[15px] font-medium">Назад</span></button>
          <h1 className="font-semibold text-[#1c1c1e] text-[15px]">Отчёт</h1>
          <button onClick={() => shareReport(transactions, totalTopup, totalExpense, finalBalance, startDate, endDate)} className="flex items-center gap-1.5 bg-[#007aff] text-white px-3.5 py-1.5 rounded-full text-[13px] font-semibold active:scale-95 transition shadow-sm"><Share size={14} /><span>Поделиться</span></button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 py-5">
        <div className="bg-white rounded-[16px] shadow-lg shadow-black/10 overflow-hidden border border-white/80">
          <div className="bg-gradient-to-r from-[#ff2d55] to-[#ff6b6b] px-5 py-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
            <div className="relative"><h2 className="text-white font-bold text-[18px]">Отчёт о расходах</h2><p className="text-white/60 text-[13px] mt-0.5 font-medium">{formatDate(startDate)} — {formatDate(endDate)}</p></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead><tr className="bg-[#f2f2f7]">
                <th className="px-3 py-2.5 text-center font-semibold text-[11px] uppercase tracking-wider text-[#8e8e93] w-8">№</th>
                <th className="px-3 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wider text-[#8e8e93]">Дата</th>
                <th className="px-3 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wider text-[#8e8e93]">Категория</th>
                <th className="px-3 py-2.5 text-right font-semibold text-[11px] uppercase tracking-wider text-[#8e8e93]">Сумма</th>
                <th className="px-3 py-2.5 text-center font-semibold text-[11px] uppercase tracking-wider text-[#8e8e93] w-10">Чек</th>
                <th className="px-3 py-2.5 text-right font-semibold text-[11px] uppercase tracking-wider text-[#8e8e93]">Баланс</th>
              </tr></thead>
              <tbody>{sorted.map((t, i) => (
                <tr key={t.id} className={`border-t border-[#c6c6c8]/20 ${t.type === 'topup' ? 'bg-[#34c759]/[0.06]' : i % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                  <td className="px-3 py-2.5 text-center text-[#8e8e93] font-mono text-[12px]">{i+1}</td>
                  <td className="px-3 py-2.5 text-[#3c3c43] font-mono text-[12px] whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="px-3 py-2.5 font-medium text-[#1c1c1e]">{t.category}</td>
                  <td className={`px-3 py-2.5 text-right font-bold font-mono whitespace-nowrap ${t.type === 'topup' ? 'text-[#34c759]' : 'text-[#ff2d55]'}`}>{t.type === 'topup' ? '+' : '−'}{formatMoney(t.amount)}</td>
                  <td className="px-3 py-2.5 text-center">{t.type !== 'topup' ? (t.hasReceipt ? <span className="text-[#34c759] text-xs font-bold">✓</span> : <span className="text-[#8e8e93] text-xs">✗</span>) : <span className="text-[#c7c7cc]">—</span>}</td>
                  <td className={`px-3 py-2.5 text-right font-bold font-mono whitespace-nowrap ${t.balanceAfter >= 0 ? 'text-[#1c1c1e]' : 'text-[#ff2d55]'}`}>{formatMoney(t.balanceAfter)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="border-t-2 border-[#c6c6c8]/40">
            <div className="flex justify-between items-center px-5 py-3 bg-[#34c759]/[0.08] border-b border-[#c6c6c8]/15"><span className="text-[14px] font-semibold text-[#3c3c43]">Итого пополнено</span><span className="text-[15px] font-bold text-[#34c759] font-mono">+{formatMoney(totalTopup)}</span></div>
            <div className="flex justify-between items-center px-5 py-3 bg-[#ff2d55]/[0.05] border-b border-[#c6c6c8]/15"><span className="text-[14px] font-semibold text-[#3c3c43]">Итого расходов</span><span className="text-[15px] font-bold text-[#ff2d55] font-mono">−{formatMoney(totalExpense)}</span></div>
            <div className={`flex justify-between items-center px-5 py-4 ${finalBalance >= 0 ? 'bg-[#f2f2f7]' : 'bg-[#ff2d55]/[0.08]'}`}><span className="text-[16px] font-bold text-[#1c1c1e]">Остаток</span><span className={`text-[20px] font-extrabold font-mono ${finalBalance >= 0 ? 'text-[#1c1c1e]' : 'text-[#ff2d55]'}`}>{formatMoney(finalBalance)}</span></div>
            {finalBalance < 0 && <div className="flex justify-between items-center px-5 py-3 bg-[#ff2d55]"><span className="text-[14px] font-bold text-white">⚠️ Долг</span><span className="text-[18px] font-extrabold text-white font-mono">{formatMoney(Math.abs(finalBalance))}</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
