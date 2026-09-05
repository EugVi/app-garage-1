import { Modal } from '../components/Modal';
import { useFleet } from '../store';
import { formatMoney } from '../utils/currency';
import {
  fleetValue,
  projectedMonthlyIncome,
  activeVehicleCount,
  completedVehicleCount,
  cumulativeIncome,
} from '../utils/fleet';
import { BarChart3, Car, DollarSign, TrendingUp, Calendar } from 'lucide-react';

interface BusinessMetricsProps {
  open: boolean;
  onClose: () => void;
}

export function BusinessMetrics({ open, onClose }: BusinessMetricsProps) {
  const { state } = useFleet();
  const { settings } = state;

  const value = fleetValue(state);
  const monthly = projectedMonthlyIncome(state);
  const annual = monthly * 12;
  const active = activeVehicleCount(state);
  const completed = completedVehicleCount(state);
  const actualIncome = cumulativeIncome(state);

  const totalAcquisitionCost = state.vehicles.reduce((s, v, i) => {
    if (v.ready || v.earning) return s + settings.vehicles[i].priceNAD + settings.vehicles[i].deploymentCostNAD;
    return s;
  }, 0);

  const paybackPct = totalAcquisitionCost > 0 ? Math.min(100, (actualIncome / totalAcquisitionCost) * 100) : 0;
  const isPaidBack = paybackPct >= 100;

  const metrics = [
    { icon: <Car size={16} />, label: 'Fleet Value', value: formatMoney(value, settings), color: 'text-emerald-400' },
    { icon: <TrendingUp size={16} />, label: 'Projected Monthly', value: formatMoney(monthly, settings), color: 'text-emerald-400' },
    { icon: <Calendar size={16} />, label: 'Projected Annual', value: formatMoney(annual, settings), color: 'text-white' },
    { icon: <DollarSign size={16} />, label: 'Active Vehicles', value: `${active} / 3`, color: 'text-cyan-400' },
    { icon: <BarChart3 size={16} />, label: 'Completed', value: `${completed} / 3`, color: 'text-blue-400' },
    { icon: <DollarSign size={16} />, label: 'Actual Income Recorded', value: formatMoney(actualIncome, settings), color: 'text-emerald-400' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="BUSINESS METRICS">
      <div className="space-y-3 mb-4">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className={m.color}>{m.icon}</span>
              <span className="text-xs text-zinc-400 font-semibold">{m.label}</span>
            </div>
            <span className={`text-sm font-black ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Payback progress */}
      {totalAcquisitionCost > 0 && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Payback Progress</span>
            <span className="text-xs font-bold text-emerald-400">{paybackPct.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mb-2">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${paybackPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>{formatMoney(actualIncome, settings)} earned</span>
            <span>{formatMoney(totalAcquisitionCost, settings)} cost</span>
          </div>
          {isPaidBack && (
            <p className="text-sm font-black text-emerald-400 mt-2 text-center animate-pulse">ASSET PAID BACK</p>
          )}
        </div>
      )}

      <p className="text-[10px] text-zinc-600 mt-3 text-center">
        Projected income is an assumption. Record actual income to track real payback.
      </p>
    </Modal>
  );
}
