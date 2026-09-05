import { useState } from 'react';
import { Fuel, Flame, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useFleet } from '../store';
import { GlassCard } from '../components/GlassCard';
import { formatMoneyWithSign } from '../utils/currency';
import type { TransactionType } from '../types';

type Filter = 'all' | 'fuel' | 'burnout';

export function HistoryView() {
  const { state } = useFleet();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = state.transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const totalIn = state.transactions.filter(t => t.type === 'fuel').reduce((s, t) => s + t.amountNAD, 0);
  const totalOut = state.transactions.filter(t => t.type === 'burnout').reduce((s, t) => s + t.amountNAD, 0);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'fuel', label: 'Add Fuel' },
    { key: 'burnout', label: 'Burnout' },
  ];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="px-4 pt-3 pb-2" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <h1 className="text-2xl font-black text-white tracking-tight mb-4">HISTORY</h1>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <GlassCard className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownLeft size={14} className="text-emerald-400" />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Fuel Added</span>
            </div>
            <p className="text-base font-black text-emerald-400">{formatMoneyWithSign(totalIn, state.settings, true)}</p>
          </GlassCard>
          <GlassCard className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight size={14} className="text-orange-400" />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Burnout</span>
            </div>
            <p className="text-base font-black text-orange-400">{formatMoneyWithSign(totalOut, state.settings, false)}</p>
          </GlassCard>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                filter === f.key
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white/5 text-zinc-500 border border-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="px-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm font-bold text-zinc-600 mb-1">No transactions yet.</p>
            <p className="text-xs text-zinc-700">Your fuel history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(tx => {
              const isFuel = tx.type === 'fuel';
              const vehicle = tx.vehicleId !== undefined ? state.vehicles[tx.vehicleId] : null;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 active:scale-[0.99] transition-transform"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isFuel ? 'bg-emerald-500/10' : 'bg-orange-500/10'
                  }`}>
                    {isFuel ? <Fuel size={16} className="text-emerald-400" /> : <Flame size={16} className="text-orange-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isFuel ? 'text-emerald-400' : 'text-orange-400'}`}>
                        {formatMoneyWithSign(tx.amountNAD, state.settings, isFuel)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                      <span>{formatDate(tx.date)} · {formatTime(tx.date)}</span>
                      {tx.source && <span className="text-zinc-500">· {tx.source}</span>}
                      {vehicle && <span className="text-zinc-500">· {vehicle.name}</span>}
                    </div>
                    {tx.note && <p className="text-xs text-zinc-500 mt-0.5 truncate">{tx.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
