import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props { onClose: () => void; onTopup: (amount: number) => void; }

export default function TopupModal({ onClose, onTopup }: Props) {
  const [amount, setAmount] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => { if (panelRef.current) panelRef.current.style.paddingBottom = `${window.innerHeight - vv.height}px`; };
    vv.addEventListener('resize', handler); vv.addEventListener('scroll', handler);
    return () => { vv.removeEventListener('resize', handler); vv.removeEventListener('scroll', handler); };
  }, []);

  const handleSubmit = () => { const val = parseFloat(amount); if (val > 0) { onTopup(val); onClose(); } };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto" onClick={onClose}>
      <div ref={panelRef} className="bg-white/80 backdrop-blur-2xl w-full max-w-md rounded-[20px] p-6 animate-slide-up mt-20 mx-4 mb-4 border border-white/60 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[17px] font-bold text-[#1c1c1e]">Пополнение баланса</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e5e5ea]/80 active:bg-[#d1d1d6] transition"><X size={16} className="text-[#8e8e93]" /></button>
        </div>
        <input type="number" inputMode="numeric" placeholder="Введите сумму" value={amount} onChange={e => setAmount(e.target.value)} className="w-full rounded-2xl px-4 py-3 text-lg font-medium mb-4 bg-[#e5e5ea]/50 placeholder:text-[#8e8e93] text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#34c759]/40 border border-white/50 transition" autoFocus />
        <button onClick={handleSubmit} disabled={!amount || parseFloat(amount) <= 0} className="w-full bg-[#34c759] text-white py-3 rounded-2xl font-semibold text-[17px] disabled:opacity-30 transition active:scale-[0.97] shadow-sm shadow-green-300/40">Пополнить</button>
      </div>
    </div>
  );
}
