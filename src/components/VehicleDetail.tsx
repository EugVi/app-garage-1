import { useEffect, useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Modal } from './Modal';
import { ProgressBar } from './ProgressBar';
import { GlassCard } from './GlassCard';
import { VehicleSVG } from './VehicleSVG';
import { useFleet } from '../store';
import { formatMoney } from '../utils/currency';
import {
  vehicleOverallPct,
  vehiclePurchasePct,
  vehicleDeploymentPct,
  vehicleStage,
  vehicleStatus,
} from '../utils/fleet';

interface VehicleDetailProps {
  vehicleId: number;
  open: boolean;
  onClose: () => void;
}

export function VehicleDetail({ vehicleId, open, onClose }: VehicleDetailProps) {
  const { state, renameVehicle, toggleEarning, recordIncome } = useFleet();
  const vehicle = state.vehicles[vehicleId];
  const cfg = state.settings.vehicles[vehicleId];
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(vehicle.name);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');

  useEffect(() => {
    setName(vehicle.name);
    setEditing(false);
  }, [vehicleId, open, vehicle.name]);

  if (!vehicle) return null;

  const overallPct = vehicleOverallPct(vehicle, cfg);
  const purchasePct = vehiclePurchasePct(vehicle, cfg);
  const deployPct = vehicleDeploymentPct(vehicle, cfg);
  const stage = vehicleStage(vehicle, cfg);
  const status = vehicleStatus(vehicle, cfg);
  const remainingDeploy = Math.max(0, cfg.deploymentCostNAD - vehicle.deploymentSavedNAD);
  const remainingPurchase = Math.max(0, cfg.priceNAD - vehicle.savedNAD);

  const handleSaveName = () => {
    if (name.trim()) renameVehicle(vehicleId + 1, name.trim());
    setEditing(false);
  };

  const handleRecordIncome = () => {
    const amt = parseFloat(incomeAmount);
    if (amt > 0) {
      const nad = amt; // input in display currency — simplified, assume NAD for now
      recordIncome(vehicleId + 1, nad);
      setIncomeAmount('');
      setShowIncomeModal(false);
    }
  };

  const statusColors: Record<string, string> = {
    BUILDING: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    ACQUIRED: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    DEPLOYING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    READY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    EARNING: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <Modal open={open} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-500 font-bold tracking-widest">
          VEHICLE {String(vehicleId + 1).padStart(2, '0')}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[status]}`}>
          {status}
        </span>
      </div>

      {/* Name */}
      <div className="flex items-center gap-2 mb-4">
        {editing ? (
          <>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white text-lg font-bold flex-1 focus:outline-none focus:border-emerald-500/40"
              autoFocus
            />
            <button onClick={handleSaveName} className="text-emerald-400 p-1"><Check size={20} /></button>
            <button onClick={() => { setEditing(false); setName(vehicle.name); }} className="text-zinc-500 p-1"><X size={20} /></button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-white">{vehicle.name}</h2>
            <button onClick={() => setEditing(true)} className="text-zinc-500 hover:text-emerald-400 transition-colors">
              <Pencil size={14} />
            </button>
          </>
        )}
      </div>

      {/* Vehicle visualization */}
      <div className="flex justify-center mb-2 py-4 bg-gradient-to-b from-white/[0.02] to-transparent rounded-xl">
        <VehicleSVG stage={stage} progress={overallPct} size={220} />
      </div>

      {/* Stage label */}
      <div className="text-center mb-5">
        <span className={`text-sm font-bold tracking-widest ${stage === 'ACQUIRED' ? 'text-emerald-400' : 'text-zinc-400'}`}>
          {stage.replace('_', ' ')}
        </span>
      </div>

      {/* Overall completion */}
      <div className="mb-5">
        <div className="flex items-end justify-between mb-2">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Overall Completion</span>
          <span className="text-2xl font-black text-white">{overallPct.toFixed(0)}<span className="text-sm text-zinc-500">%</span></span>
        </div>
        <ProgressBar pct={overallPct} color="#22c55e" height={8} glow />
      </div>

      {/* Purchase and Deployment breakdown */}
      <div className="grid grid-cols-1 gap-3 mb-5">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Vehicle Purchase</span>
            <span className="text-xs text-zinc-500">{purchasePct.toFixed(0)}%</span>
          </div>
          <div className="text-lg font-bold text-white mb-2">
            {formatMoney(vehicle.savedNAD, state.settings)} <span className="text-sm text-zinc-600">/ {formatMoney(cfg.priceNAD, state.settings)}</span>
          </div>
          <ProgressBar pct={purchasePct} color="#3b82f6" height={5} />
          {remainingPurchase > 0 && (
            <p className="text-xs text-zinc-500 mt-2">Remaining: {formatMoney(remainingPurchase, state.settings)}</p>
          )}
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Deployment</span>
            <span className="text-xs text-zinc-500">{deployPct.toFixed(0)}%</span>
          </div>
          <div className="text-lg font-bold text-white mb-2">
            {formatMoney(vehicle.deploymentSavedNAD, state.settings)} <span className="text-sm text-zinc-600">/ {formatMoney(cfg.deploymentCostNAD, state.settings)}</span>
          </div>
          <ProgressBar pct={deployPct} color="#f59e0b" height={5} />
          {remainingDeploy > 0 && (
            <p className="text-xs text-amber-400/70 mt-2">Remaining to Deploy: {formatMoney(remainingDeploy, state.settings)}</p>
          )}
        </GlassCard>
      </div>

      {/* Deployment cost breakdown */}
      <div className="mb-5">
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Deployment Costs Include</span>
        <div className="flex flex-wrap gap-2">
          {['Yango Registration', 'GPS Tracker', 'Insurance', 'Initial Maintenance', 'Other Setup'].map(item => (
            <span key={item} className="text-[10px] text-zinc-400 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Earning controls */}
      {vehicle.ready && (
        <div className="mb-5">
          <GlassCard className="p-4" glow={vehicle.earning} glowColor="rgba(34,197,94,0.15)">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-bold text-white">Earning Status</span>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {vehicle.earning ? 'Active and generating income' : 'Mark as earning to track income'}
                </p>
              </div>
              <button
                onClick={() => toggleEarning(vehicleId + 1)}
                className={`relative w-12 h-7 rounded-full transition-colors ${vehicle.earning ? 'bg-emerald-500' : 'bg-white/10'}`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${vehicle.earning ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            {vehicle.earning && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Actual Income Recorded</span>
                <span className="text-emerald-400 font-bold">{formatMoney(vehicle.actualIncomeNAD, state.settings)}</span>
              </div>
            )}
            {vehicle.earning && (
              <button
                onClick={() => setShowIncomeModal(true)}
                className="w-full mt-3 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors active:scale-95"
              >
                Record Actual Income
              </button>
            )}
          </GlassCard>
        </div>
      )}

      {/* Income modal */}
      {showIncomeModal && (
        <Modal open={showIncomeModal} onClose={() => setShowIncomeModal(false)} title="Record Income" accent="green">
          <div className="mb-4">
            <p className="text-sm text-zinc-400 mb-3">Record actual income received from {vehicle.name}.</p>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Amount in NAD"
              value={incomeAmount}
              onChange={e => setIncomeAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40"
              autoFocus
            />
          </div>
          <button
            onClick={handleRecordIncome}
            className="w-full py-3.5 rounded-xl bg-emerald-500 text-black font-bold active:scale-95 transition-transform"
          >
            Record Income
          </button>
        </Modal>
      )}
    </Modal>
  );
}
