import { Modal } from '../components/Modal';
import { useFleet } from '../store';
import { formatMoney } from '../utils/currency';
import {
  vehicleOverallPct,
  avgSavingsRate,
  estimatedCompletionDate,
} from '../utils/fleet';
import { Car, TrendingUp, DollarSign } from 'lucide-react';

interface FleetForecastProps {
  open: boolean;
  onClose: () => void;
}

export function FleetForecast({ open, onClose }: FleetForecastProps) {
  const { state } = useFleet();
  const { settings } = state;

  // Estimate monthly savings from last 30 days
  const monthlySavings = avgSavingsRate(state, 30);
  const dailySavings = monthlySavings / 30;

  const vehicles = state.vehicles.map((v, i) => {
    const cfg = settings.vehicles[i];
    const total = cfg.priceNAD + cfg.deploymentCostNAD;
    const saved = v.savedNAD + v.deploymentSavedNAD;
    const remaining = Math.max(0, total - saved);
    const pct = vehicleOverallPct(v, cfg);
    const estDate = v.ready ? 'Complete' : estimatedCompletionDate(dailySavings * 30, remaining);
    return { id: i, name: v.name, remaining, pct, estDate, ready: v.ready };
  });

  const cumulativeIncome: number[] = [];
  let income = 0;
  vehicles.forEach((v) => {
    if (v.ready) income += settings.monthlyIncomePerVehicleNAD;
    cumulativeIncome.push(income);
  });

  return (
    <Modal open={open} onClose={onClose} title="FLEET FORECAST">
      <p className="text-xs text-zinc-500 mb-4">
        Estimated timeline based on your average savings rate of{' '}
        <span className="text-emerald-400 font-bold">{formatMoney(Math.max(0, monthlySavings), settings)}/mo</span>
      </p>

      {/* Timeline */}
      <div className="space-y-0">
        {/* Today */}
        <div className="flex items-center gap-3 mb-0">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-white/20 border-2 border-white/30" />
            <div className="w-0.5 h-12 bg-gradient-to-b from-white/20 to-emerald-500/30" />
          </div>
          <div className="pb-3">
            <span className="text-xs font-bold text-zinc-500 tracking-wider">TODAY</span>
          </div>
        </div>

        {vehicles.map((v, i) => (
          <div key={v.id}>
            {/* Vehicle node */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 ${v.ready ? 'bg-emerald-500 border-emerald-400' : 'bg-zinc-700 border-zinc-600'}`} />
                <div className="w-0.5 h-10 bg-gradient-to-b from-emerald-500/30 to-amber-500/30" />
              </div>
              <div className="pb-2 flex-1">
                <div className="flex items-center gap-2">
                  <Car size={14} className={v.ready ? 'text-emerald-400' : 'text-zinc-500'} />
                  <span className="text-sm font-bold text-white">{v.name}</span>
                  {v.ready && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">COMPLETE</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-zinc-600">{v.pct.toFixed(0)}%</span>
                  {v.estDate && !v.ready && (
                    <span className="text-[10px] text-amber-400 font-semibold">est. {v.estDate}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Income node */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 ${cumulativeIncome[i] > 0 ? 'bg-emerald-500 border-emerald-400' : 'bg-zinc-800 border-zinc-700'}`} />
                {i < 2 && <div className="w-0.5 h-10 bg-gradient-to-b from-amber-500/30 to-emerald-500/30" />}
              </div>
              <div className="pb-2 flex-1">
                <div className="flex items-center gap-2">
                  <DollarSign size={12} className="text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">{formatMoney(cumulativeIncome[i], settings)}/month</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Final state */}
      <div className="mt-2 bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={16} className="text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Full Fleet</span>
        </div>
        <p className="text-2xl font-black text-emerald-400">{formatMoney(settings.monthlyIncomePerVehicleNAD * 3, settings)}/month</p>
        <p className="text-sm text-zinc-500 mt-1">{formatMoney(settings.monthlyIncomePerVehicleNAD * 3 * 12, settings)}/year</p>
      </div>

      <p className="text-[10px] text-zinc-600 mt-3 text-center">
        Projections are estimates based on historical savings rate, not guarantees.
      </p>
    </Modal>
  );
}
