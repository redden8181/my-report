import { useState, useEffect, useRef } from 'react';
import { X, Receipt } from 'lucide-react';

interface Props {
  transaction: { id: string; type: 'expense' | 'topup'; category: string; amount: number; hasReceipt: boolean; };
  onClose: () => void;
  onSave: (id: string, category: string, amount: number, hasReceipt: boolean) => void;
  onDelete: (id: string) => void;
}

export default function EditTransactionModal({ transaction, onClose, onSave, onDelete }: Props) {
  const [category, setCategory] = useState(transaction.category);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [hasReceipt, setHasReceipt] = useState(transaction.hasReceipt);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vv = window.visualViewport; if (!vv) return;
    const handler = () => { if (panelRef.current) panelRef.current.style.paddingBottom = `${window.innerHeight - vv.height}px`; };
    vv.addEventListener('resize', handler); vv.addEventListener('scroll', handler);
    return () => { vv.removeEventListener('resize', handler); vv.removeEventListener('scroll', handler); };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto" onClick={onClose}>
      <div ref={panelRef} className="bg-white/80 backdrop-blur-2xl w-full max-w-md rounded-[20px] p-6 animate-slide-up mt-20 mx-4 mb-4 border border-white/60 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[17px] font-bold text-[#1c1c1e]">Редактирование</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e5e5ea]/80 active:bg-[#d1d1d6] transition"><X size={16} className="text-[#8e8e93]" /></button>
        </div>
        <input type="text" placeholder="Название" value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-2xl px-4 py-3 text-[15px] font-medium mb-3 bg-[#e5e5ea]/50 placeholder:text-[#8e8e93] text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 border border-white/50 transition" />
        <input type="number" inputMode="numeric" placeholder="Сумма" value={amount} onChange={e => setAmount(e.target.value)} className="w-full rounded-2xl px-4 py-3 text-lg font-medium mb-3 bg-[#e5e5ea]/50 placeholder:text-[#8e8e93] text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 border border-white/50 transition" />
        <button onClick={() => setHasReceipt(!hasReceipt)} className={`flex items-center gap-2 w-full px-4 py-3 rounded-2xl mb-4 transition-all ${hasReceipt ? 'bg-[#34c759] text-white' : 'bg-[#e5e5ea]/50 text-[#8e8e93] border border-white/50'}`}>
          <Receipt size={16} /><span className="font-medium text-sm">{hasReceipt ? 'Чек есть ✓' : 'Чек отсутствует'}</span>
        </button>
        <div className="flex gap-2">
          <button onClick={() => { const val = parseFloat(amount); if (val > 0 && category.trim()) { onSave(transaction.id, category.trim(), val, hasReceipt); onClose(); } }} disabled={!amount || parseFloat(amount) <= 0 || !category.trim()} className="flex-1 bg-[#007aff] text-white py-3 rounded-2xl font-semibold disabled:opacity-30 transition active:scale-[0.97]">Сохранить</button>
          <button onClick={() => { if (showDeleteConfirm) { onDelete(transaction.id); onClose(); } else setShowDeleteConfirm(true); }} className={`px-4 py-3 rounded-2xl font-semibold transition active:scale-95 ${showDeleteConfirm ? 'bg-[#ff3b30] text-white' : 'bg-[#e5e5ea]/60 text-[#ff3b30]'}`}>{showDeleteConfirm ? 'Точно?' : 'Удалить'}</button>
        </div>
      </div>
    </div>
  );
}
