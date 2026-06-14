// BACKUP v1.0.1 - iOS Glass Theme
// Run `cp backup/* src/` to restore

import { useState, useRef, useCallback } from 'react';
import { Settings as SettingsIcon, FileText, TrendingUp, TrendingDown, Plus, Receipt } from 'lucide-react';
import { StoreProvider, useStore } from './store';
import ErrorBoundary from './ErrorBoundary';
import TopupModal from './components/TopupModal';
import EditTransactionModal from './components/EditTransactionModal';
import ReportPreview from './components/ReportPreview';
import ReportsHistory from './components/ReportsHistory';
import SettingsScreen from './components/Settings';
import type { Transaction } from './types';

function formatMoney(n: number): string {
  return n.toLocaleString('ru-RU') + ' ₽';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

const QUICK_CATEGORIES = ['АЗС', 'Мойка', 'Парковка', 'Платка', 'Аптека', 'Магазин'];
const PARKING_AMOUNTS = [150, 380, 450, 600, 800];

type Screen = 'main' | 'report-preview' | 'reports-history' | 'settings';

function MainApp() {
  const { state, dispatch } = useStore();
  const [screen, setScreen] = useState<Screen>('main');
  const [showTopup, setShowTopup] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [expCategory, setExpCategory] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expHasReceipt, setExpHasReceipt] = useState(false);
  const [expCustomCategory, setExpCustomCategory] = useState('');

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const pressAnimFrame = useRef<ReturnType<typeof setInterval> | null>(null);

  const startLongPress = useCallback(() => {
    setPressing(true);
    setPressProgress(0);
    const startTime = Date.now();
    pressAnimFrame.current = setInterval(() => {
      setPressProgress(Math.min((Date.now() - startTime) / 1000, 1));
    }, 16);
    longPressTimer.current = setTimeout(() => {
      dispatch({ type: 'NEW_REPORT' });
      setPressing(false);
      setPressProgress(0);
      if (pressAnimFrame.current) clearInterval(pressAnimFrame.current);
    }, 1000);
  }, [dispatch]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (pressAnimFrame.current) { clearInterval(pressAnimFrame.current); pressAnimFrame.current = null; }
    setPressing(false);
    setPressProgress(0);
  }, []);

  const handleAddExpense = () => {
    const cat = expCustomCategory.trim() || expCategory;
    const val = parseFloat(expAmount);
    if (val > 0 && cat) {
      dispatch({ type: 'ADD_EXPENSE', category: cat, amount: val, hasReceipt: expHasReceipt });
      setExpCategory('');
      setExpAmount('');
      setExpHasReceipt(false);
      setExpCustomCategory('');
    }
  };

  const selectCategory = (label: string) => {
    setExpCategory(label);
    setExpCustomCategory('');
  };

  const activeCategory = expCustomCategory.trim() || expCategory;

  if (screen === 'report-preview') {
    const totalTopup = state.transactions.filter(t => t.type === 'topup').reduce((s, t) => s + t.amount, 0);
    const totalExpense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const dates = state.transactions.map(t => t.date);
    return (
      <ReportPreview
        transactions={state.transactions}
        totalTopup={totalTopup}
        totalExpense={totalExpense}
        finalBalance={state.balance}
        startDate={dates[dates.length - 1] || new Date().toISOString()}
        endDate={dates[0] || new Date().toISOString()}
        onBack={() => setScreen('main')}
      />
    );
  }
  if (screen === 'reports-history') {
    return (
      <ReportsHistory
        reports={state.reports}
        currentTransactions={state.transactions}
        currentBalance={state.balance}
        onBack={() => setScreen('main')}
      />
    );
  }
  if (screen === 'settings') {
    return <SettingsScreen onBack={() => setScreen('main')} />;
  }

  const totalIn = state.transactions.filter(t => t.type === 'topup').reduce((s, t) => s + t.amount, 0);
  const totalOut = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#f2f2f7]">
      <div className="sticky top-0 z-10 bg-[#f2f2f7]/70 backdrop-blur-2xl border-b border-white/60">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-2">
          <h1 className="text-lg font-bold text-[#1c1c1e]">Отчёт</h1>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setScreen('reports-history')} className="p-2.5 rounded-full active:bg-black/5 transition" title="Отчёты">
              <FileText size={20} className="text-[#007aff]" />
            </button>
            <button onClick={() => setScreen('settings')} className="p-2.5 rounded-full active:bg-black/5 transition" title="Настройки">
              <SettingsIcon size={20} className="text-[#007aff]" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#ff2d55] to-[#ff6b6b] p-5 mb-4 shadow-lg shadow-red-300/30">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/15 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-px bg-white/30" />

          <div className="relative">
            <p className="text-white/60 text-[11px] font-semibold uppercase tracking-widest mb-0.5">Текущий баланс</p>
            <p className="text-[32px] font-extrabold text-white tracking-tight leading-tight">
              {formatMoney(state.balance)}
            </p>
            {state.balance < 0 && (
              <div className="inline-flex mt-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full">
                <span className="text-[11px] font-semibold text-white">⚠️ Долг: {formatMoney(Math.abs(state.balance))}</span>
              </div>
            )}

            {state.transactions.length > 0 && (
              <div className="flex gap-5 mt-4 pt-3 border-t border-white/20">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-green-300" />
                  <span className="text-[11px] text-white/70 font-medium">+{formatMoney(totalIn)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingDown size={12} className="text-white/50" />
                  <span className="text-[11px] text-white/70 font-medium">−{formatMoney(totalOut)}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowTopup(true)}
              className="mt-4 flex items-center justify-center gap-2 w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-2.5 rounded-2xl font-semibold text-sm transition active:scale-[0.97] border border-white/10"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Пополнить баланс</span>
            </button>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[20px] border border-white/80 shadow-sm mb-4 overflow-hidden">
          <div className="px-4 pt-4 pb-1.5">
            <span className="font-semibold text-[#1c1c1e] text-[15px]">Новый расход</span>
          </div>
          <div className="px-4 pb-4 space-y-3 pt-1">
            <div className="grid grid-cols-3 gap-1.5">
              {QUICK_CATEGORIES.map(label => (
                <button
                  key={label}
                  onClick={() => selectCategory(label)}
                  className={`px-2 py-2 rounded-2xl text-[13px] font-medium transition-all ${
                    expCategory === label && !expCustomCategory.trim()
                      ? 'bg-[#ff2d55] text-white shadow-sm shadow-red-200/60'
                      : 'bg-[#e5e5ea]/60 text-[#1c1c1e] active:scale-95 active:bg-[#d1d1d6]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {!expCategory && (
              <input
                type="text"
                placeholder="Или своя категория..."
                value={expCustomCategory}
                onChange={e => { setExpCustomCategory(e.target.value); }}
                className="w-full rounded-2xl px-4 py-2.5 text-sm bg-[#e5e5ea]/50 placeholder:text-[#8e8e93] text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ff2d55]/30 border border-white/50 transition"
              />
            )}

            {expCategory && (
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#8e8e93]">Выбрано:</span>
                <span className="text-[14px] font-semibold text-[#1c1c1e]">{expCategory}</span>
                <button
                  onClick={() => { setExpCategory(''); setExpCustomCategory(''); }}
                  className="ml-auto text-[12px] text-[#007aff] active:opacity-60"
                >
                  Сбросить
                </button>
              </div>
            )}

            {activeCategory === 'Парковка' && (
              <div className="flex gap-1.5 flex-wrap">
                {PARKING_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => setExpAmount(String(a))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      expAmount === String(a)
                        ? 'bg-[#ff2d55] text-white'
                        : 'bg-[#e5e5ea]/60 text-[#1c1c1e] active:scale-95'
                    }`}
                  >
                    {a} ₽
                  </button>
                ))}
              </div>
            )}

            <input
              type="number"
              inputMode="numeric"
              placeholder="Сумма"
              value={expAmount}
              onChange={e => setExpAmount(e.target.value)}
              className="w-full rounded-2xl px-4 py-2.5 text-base font-medium bg-[#e5e5ea]/50 placeholder:text-[#8e8e93] text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ff2d55]/30 border border-white/50 transition"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setExpHasReceipt(!expHasReceipt)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all text-sm font-medium ${
                  expHasReceipt
                    ? 'bg-[#34c759] text-white'
                    : 'bg-[#e5e5ea]/60 text-[#8e8e93]'
                }`}
              >
                <Receipt size={14} />
                <span>{expHasReceipt ? 'Чек ✓' : 'Чек'}</span>
              </button>

              <button
                onClick={handleAddExpense}
                disabled={!activeCategory || !expAmount || parseFloat(expAmount) <= 0}
                className="flex-1 bg-[#ff2d55] text-white py-2.5 rounded-2xl font-semibold text-sm disabled:opacity-30 transition-all active:scale-[0.97] shadow-sm shadow-red-300/40"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>

        {state.transactions.length > 0 && (
          <button
            onClick={() => setScreen('report-preview')}
            className="w-full flex items-center justify-center gap-2 bg-white/70 backdrop-blur-xl text-[#007aff] py-2.5 rounded-2xl font-medium text-sm border border-white/80 shadow-sm mb-4 active:scale-[0.98] transition"
          >
            <FileText size={15} />
            <span>Предварительный просмотр отчёта</span>
          </button>
        )}

        <div className="mb-4">
          <h2 className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2 px-1">
            История операций
          </h2>
          {state.transactions.length === 0 ? (
            <div className="text-center py-14 bg-white/70 backdrop-blur-xl rounded-[20px] border border-white/80">
              <p className="text-4xl mb-2">📝</p>
              <p className="text-[#8e8e93] text-sm font-medium">Нет операций</p>
              <p className="text-[#c7c7cc] text-xs mt-0.5">Пополните баланс или добавьте расход</p>
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-xl rounded-[20px] border border-white/80 overflow-hidden divide-y divide-[#c6c6c8]/30">
              {state.transactions.map((t) => (
                <div key={t.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    className="w-full text-left"
                  >
                    <div className={`flex items-center justify-between px-4 py-3 transition ${
                      expandedId === t.id ? 'bg-black/[0.03]' : 'active:bg-black/[0.03]'
                    }`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          t.type === 'topup'
                            ? 'bg-[#34c759]/15 text-[#34c759]'
                            : 'bg-[#ff2d55]/10 text-[#ff2d55]'
                        }`}>
                          {t.type === 'topup' ? '＋' : '−'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[15px] font-medium text-[#1c1c1e] truncate">{t.category}</p>
                            {t.type === 'expense' && t.hasReceipt && (
                              <span className="text-[10px] bg-[#34c759]/15 text-[#34c759] px-1.5 py-0.5 rounded-full font-semibold">чек</span>
                            )}
                          </div>
                          <p className="text-[12px] text-[#8e8e93]">{formatDate(t.date)} • {formatTime(t.date)}</p>
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <p className={`text-[15px] font-semibold ${
                          t.type === 'topup' ? 'text-[#34c759]' : 'text-[#ff2d55]'
                        }`}>
                          {t.type === 'topup' ? '+' : '−'}{formatMoney(t.amount)}
                        </p>
                        <p className="text-[12px] text-[#8e8e93]">{formatMoney(t.balanceAfter)}</p>
                      </div>
                    </div>
                  </button>

                  {expandedId === t.id && (
                    <div className="flex justify-end px-4 py-2 bg-black/[0.02]">
                      <button
                        onClick={() => { setEditingTransaction(t); setExpandedId(null); }}
                        className="text-[13px] font-medium text-[#007aff] bg-[#007aff]/10 px-3.5 py-1.5 rounded-full active:scale-95 transition"
                      >
                        Редактировать
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {state.transactions.length > 0 && (
          <div className="mt-6 mb-4">
            <button
              onMouseDown={startLongPress}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={startLongPress}
              onTouchEnd={cancelLongPress}
              onTouchCancel={cancelLongPress}
              className="w-full py-3 rounded-2xl text-[13px] font-medium text-[#8e8e93] bg-[#e5e5ea]/40 backdrop-blur-sm border border-white/60 select-none relative overflow-hidden transition"
            >
              {pressing && (
                <div className="absolute inset-0 bg-[#ff2d55]/15" style={{ width: `${pressProgress * 100}%` }} />
              )}
              <span className="relative z-10">
                {pressing ? 'Удерживайте...' : 'Зажмите для нового отчёта'}
              </span>
            </button>
            <p className="text-center text-[10px] text-[#c7c7cc] mt-1.5">
              Удерживайте 1 сек для завершения периода
            </p>
          </div>
        )}
      </div>

      {showTopup && (
        <TopupModal
          onClose={() => setShowTopup(false)}
          onTopup={(amount) => dispatch({ type: 'TOPUP', amount })}
        />
      )}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={(id, category, amount, hasReceipt) =>
            dispatch({ type: 'EDIT_TRANSACTION', id, category, amount, hasReceipt })
          }
          onDelete={(id) => dispatch({ type: 'DELETE_TRANSACTION', id })}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <MainApp />
      </StoreProvider>
    </ErrorBoundary>
  );
}
