import { useState } from 'react';
import { Plus, Check, Car } from 'lucide-react';
import { Modal } from './Modal';
import { useFleet } from '../store';
import { formatMoney } from '../utils/currency';
import { CURRENCY_META } from '../constants';
import { sounds, playSound } from '../utils/sound';
import { haptics } from '../utils/haptics';

interface ExpandFleetModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExpandFleetModal({ open, onClose }: ExpandFleetModalProps) {
  const { state, addVehicle } = useFleet();
  const { settings } = state;
  const symbol = CURRENCY_META[settings.currency].symbol;

  const defaultPrice = settings.vehicles[0]?.priceNAD ?? 85000;
  const defaultDeploy = settings.vehicles[0]?.deploymentCostNAD ?? 8000;

  const [price, setPrice] = useState(String(defaultPrice));
  const [deploy, setDeploy] = useState(String(defaultDeploy));
  const [name, setName] = useState('');
  const [added, setAdded] = useState(false);

  const priceNAD = parseFloat(price) || 0;
  const deployNAD = parseFloat(deploy) || 0;

  const handleAdd = () => {
    if (priceNAD <= 0) return;
    addVehicle({ priceNAD, deploymentCostNAD: deployNAD }, name.trim() || undefined);
    playSound(settings.soundEnabled, sounds.vehicleComplete);
    haptics.unlock();
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setPrice(String(defaultPrice));
      setDeploy(String(defaultDeploy));
      setName('');
      onClose();
    }, 800);
  };

  const nextVehicleNum = state.vehicles.length + 1;

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-semibold placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors';
  const labelClass = 'text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5 block';

  return (
    <Modal open={open} onClose={onClose} accent="green" title="EXPAND FLEET">
      <div className="flex flex-col items-center mb-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
          {added ? <Check size={28} className="text-emerald-400" /> : <Plus size={28} className="text-emerald-400" />}
        </div>
        <h2 className="text-lg font-bold text-white tracking-wide">
          {added ? 'VEHICLE ADDED' : `ADD VEHICLE ${String(nextVehicleNum).padStart(2, '0')}`}
        </h2>
        <p className="text-xs text-zinc-500 mt-1 text-center">
          Your fleet is operational. Add another vehicle to scale your income engine.
        </p>
      </div>

      {!added && (
        <>
          <div className="mb-4">
            <label className={labelClass}>Vehicle Name (Optional)</label>
            <input
              type="text"
              placeholder={`Vehicle ${String(nextVehicleNum).padStart(2, '0')}`}
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={labelClass}>Price (NAD)</label>
              <input
                type="number"
                inputMode="decimal"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className={inputClass}
                autoFocus
              />
            </div>
            <div>
              <label className={labelClass}>Deployment (NAD)</label>
              <input
                type="number"
                inputMode="decimal"
                value={deploy}
                onChange={e => setDeploy(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Cost</span>
              <span className="text-lg font-black text-white">{formatMoney(priceNAD + deployNAD, settings)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Projected Income</span>
              <span className="text-sm font-bold text-emerald-400">{formatMoney(settings.monthlyIncomePerVehicleNAD, settings)}/mo</span>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={priceNAD <= 0}
            className="w-full py-4 rounded-xl bg-emerald-500 text-black font-bold text-base tracking-wide active:scale-[0.98] transition-transform disabled:opacity-30 shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
          >
            <Car size={18} /> ADD TO FLEET
          </button>
        </>
      )}

      {added && (
        <div className="text-center py-8" style={{ animation: 'expandBayIn 0.4s ease-out' }}>
          <p className="text-sm font-bold text-emerald-400">A new bay has been opened in your garage.</p>
        </div>
      )}
    </Modal>
  );
}
