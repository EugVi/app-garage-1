import { useState } from 'react';
import { Modal } from '../components/Modal';
import { useFleet } from '../store';
import { formatMoney, convertToNAD } from '../utils/currency';
import { estimatedCompletionDate } from '../utils/fleet';
import { Zap, Car } from 'lucide-react';

interface WhatIfSimulatorProps {
  open: boolean;
  onClose: () => void;
}

type Scenario = 'conservative' | 'expected' | 'aggressive';

export function WhatIfSimulator({ open, onClose }: WhatIfSimulatorProps) {
  const { state } = useFleet();
  const { settings } = state;

  const [monthlySavings, setMonthlySavings] = useState('5000');
  const [vehicleCost, setVehicleCost] = useState(String(settings.vehicles[0].priceNAD));
  const [deployCost, setDeployCost] = useState(String(settings.vehicles[0].deploymentCostNAD));
  const [incomePerVehicle, setIncomePerVehicle] = useState(String(settings.monthlyIncomePerVehicleNAD));
  const [reinvestPct, setReinvestPct] = useState(String(settings.reinvestmentPct));
  const [scenario, setScenario] = useState<Scenario>('expected');

  const applyScenario = (s: Scenario) => {
    setScenario(s);
    if (s === 'conservative') {
      setMonthlySavings('3000');
      setReinvestPct('60');
    } else if (s === 'expected') {
      setMonthlySavings('5000');
      setReinvestPct('80');
    } else {
      setMonthlySavings('8000');
      setReinvestPct('100');
    }
  };

  const ms = parseFloat(monthlySavings) || 0;
  const vc = parseFloat(vehicleCost) || 0;
  const dc = parseFloat(deployCost) || 0;
  const ipv = parseFloat(incomePerVehicle) || 0;
  const rp = Math.min(100, Math.max(0, parseFloat(reinvestPct) || 0)) / 100;

  // Simulate fleet completion
  let currentSavings = 0;
  let monthlyIncome = 0;
  const results: { name: string; date: string | null; totalMonths: number }[] = [];

  for (let i = 0; i < 3; i++) {
    const totalCost = vc + dc;
    const remaining = Math.max(0, totalCost - currentSavings);
    const effectiveMonthly = ms + monthlyIncome * rp;
    const monthsNeeded = effectiveMonthly > 0 ? Math.ceil(remaining / effectiveMonthly) : 999;

    if (monthsNeeded >= 999) {
      results.push({ name: `Vehicle ${String(i + 1).padStart(2, '0')}`, date: null, totalMonths: monthsNeeded });
    } else {
      const date = new Date();
      date.setMonth(date.getMonth() + monthsNeeded);
      results.push({
        name: `Vehicle ${String(i + 1).padStart(2, '0')}`,
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalMonths: monthsNeeded,
      });
      currentSavings = 0; // reset, vehicle purchased
      monthlyIncome += ipv; // new vehicle adds income
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-semibold placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors";

  return (
    <Modal open={open} onClose={onClose} title="WHAT IF?">
      <p className="text-xs text-zinc-500 mb-4">
        Experiment with different scenarios. Projections are estimates, not guarantees.
      </p>

      {/* Scenario buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(['conservative', 'expected', 'aggressive'] as Scenario[]).map(s => (
          <button
            key={s}
            onClick={() => applyScenario(s)}
            className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
              scenario === s
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-zinc-400 border border-white/10'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Monthly Savings</label>
          <input type="number" inputMode="decimal" value={monthlySavings} onChange={e => setMonthlySavings(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Vehicle Cost</label>
          <input type="number" inputMode="decimal" value={vehicleCost} onChange={e => setVehicleCost(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Deployment</label>
          <input type="number" inputMode="decimal" value={deployCost} onChange={e => setDeployCost(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Monthly Income/Vehicle</label>
          <input type="number" inputMode="decimal" value={incomePerVehicle} onChange={e => setIncomePerVehicle(e.target.value)} className={inputClass} />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Reinvestment %</label>
          <input type="number" inputMode="decimal" value={reinvestPct} onChange={e => setReinvestPct(e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2 mb-4">
        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Estimated Completion</span>
        {results.map((r, i) => (
          <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Car size={14} className={r.date ? 'text-emerald-400' : 'text-zinc-600'} />
              <span className="text-sm font-bold text-white">{r.name}</span>
            </div>
            <span className={`text-sm font-bold ${r.date ? 'text-emerald-400' : 'text-zinc-600'}`}>
              {r.date || 'Never'}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={14} className="text-emerald-400" />
          <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Full Fleet Income</span>
        </div>
        <p className="text-xl font-black text-emerald-400">{formatMoney(ipv * 3, settings)}/month</p>
      </div>
    </Modal>
  );
}
