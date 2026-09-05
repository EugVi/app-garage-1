import { useState } from 'react';
import { Modal } from '../components/Modal';
import { useFleet } from '../store';
import { formatMoney } from '../utils/currency';
import { RotateCw } from 'lucide-react';

interface ReinvestmentEngineProps {
  open: boolean;
  onClose: () => void;
}

export function ReinvestmentEngine({ open, onClose }: ReinvestmentEngineProps) {
  const { state } = useFleet();
  const { settings } = state;
  const [pct, setPct] = useState(settings.reinvestmentPct);

  const activeCount = state.vehicles.filter(v => v.ready || v.earning).length;
  const fleetIncome = activeCount * settings.monthlyIncomePerVehicleNAD;
  const toFleet = fleetIncome * (pct / 100);
  const toPersonal = fleetIncome * (1 - pct / 100);

  // How fast does reinvestment accelerate next vehicle?
  const nextVehicle = state.vehicles.find(v => !v.ready);
  const nextRemaining = nextVehicle
    ? (() => {
        const idx = state.vehicles.indexOf(nextVehicle);
        const cfg = settings.vehicles[idx];
        return Math.max(0, cfg.priceNAD + cfg.deploymentCostNAD - nextVehicle.savedNAD - nextVehicle.deploymentSavedNAD);
      })()
    : 0;

  const monthsWithReinvest = toFleet > 0 ? Math.ceil(nextRemaining / toFleet) : 0;
  const monthsWithoutReinvest = fleetIncome > 0 ? Math.ceil(nextRemaining / fleetIncome) : 0;
  const acceleration = monthsWithoutReinvest - monthsWithReinvest;

  return (
    <Modal open={open} onClose={onClose} title="REINVESTMENT ENGINE">
      {activeCount === 0 ? (
        <div className="text-center py-8">
          <RotateCw size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No active vehicles yet.<br />Complete a vehicle to model reinvestment.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500 mb-4">
            Model how reinvesting fleet income accelerates your next vehicle acquisition.
            <br /><span className="text-[10px] text-zinc-600">This is a projection, not guaranteed income.</span>
          </p>

          {/* Current fleet income */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-4">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Fleet Income</span>
            <p className="text-2xl font-black text-emerald-400">{formatMoney(fleetIncome, settings)}<span className="text-sm text-zinc-600">/month</span></p>
            <p className="text-xs text-zinc-600 mt-1">{activeCount} active vehicle{activeCount > 1 ? 's' : ''}</p>
          </div>

          {/* Slider */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Reinvestment Rate</span>
              <span className="text-sm font-black text-emerald-400">{pct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={pct}
              onChange={e => setPct(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Split visualization */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">→ Fleet</span>
              <p className="text-lg font-black text-emerald-400 mt-1">{formatMoney(toFleet, settings)}</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
              <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">→ Personal</span>
              <p className="text-lg font-black text-blue-400 mt-1">{formatMoney(toPersonal, settings)}</p>
            </div>
          </div>

          {/* Acceleration projection */}
          {nextVehicle && toFleet > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-4">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Acceleration</span>
              <p className="text-sm text-zinc-300 mt-1">
                At {pct}% reinvestment, your next vehicle could be acquired in{' '}
                <span className="text-amber-400 font-black">{monthsWithReinvest} months</span>
              </p>
              {acceleration > 0 && (
                <p className="text-xs text-emerald-400 mt-1">
                  {acceleration} months faster than 100% personal withdrawal
                </p>
              )}
              <p className="text-[10px] text-zinc-600 mt-2">
                {formatMoney(nextRemaining, settings)} remaining for next vehicle
              </p>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
