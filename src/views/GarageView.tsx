import { useEffect, useRef, useState } from 'react';
import { Fuel, Flame, Lock, ChevronRight, Zap, Sun, Trophy, TrendingUp, RotateCw, BarChart3 } from 'lucide-react';
import { useFleet } from '../store';
import { GlassCard } from '../components/GlassCard';
import { ProgressBar } from '../components/ProgressBar';
import { VehicleSVG } from '../components/VehicleSVG';
import { RollingNumber } from '../components/RollingNumber';
import { TransactionModal } from '../components/TransactionModal';
import { VehicleDetail } from '../components/VehicleDetail';
import { Confetti } from '../components/Confetti';
import { formatMoney } from '../utils/currency';
import {
  fleetBalance,
  totalFleetGoal,
  projectedMonthlyIncome,
  freedomDays,
  fleetValue,
  vehicleOverallPct,
  vehicleStage,
  nextMilestone,
  getFleetLevel,
  completedVehicleCount,
  tradingProfitsAllocated,
} from '../utils/fleet';
import { sounds, playSound } from '../utils/sound';
import { haptics } from '../utils/haptics';
import { FleetForecast } from '../views/FleetForecast';
import { WhatIfSimulator } from '../views/WhatIfSimulator';
import { ReinvestmentEngine } from '../views/ReinvestmentEngine';
import { AchievementsView } from '../views/AchievementsView';
import { BusinessMetrics } from '../views/BusinessMetrics';
import type { VehicleStage, Settings } from '../types';

export function GarageView() {
  const { state } = useFleet();
  const { settings } = state;
  const [txModal, setTxModal] = useState<{ type: 'fuel' | 'burnout'; open: boolean; vehicleId?: number }>({
    type: 'fuel', open: false,
  });
  const [detailVehicle, setDetailVehicle] = useState<number | null>(null);
  const [showForecast, setShowForecast] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [showReinvest, setShowReinvest] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const prevCompleteRef = useRef(0);

  const balance = fleetBalance(state);
  const goal = totalFleetGoal(settings);
  const monthlyIncome = projectedMonthlyIncome(state);
  const freedom = freedomDays(state);
  const value = fleetValue(state);
  const completed = completedVehicleCount(state);
  const milestone = nextMilestone(state);
  const level = getFleetLevel(state.xp);
  const tradingAllocated = tradingProfitsAllocated(state);

  // Overall fleet progress for atmosphere
  const fleetPct = goal > 0 ? (balance / goal) * 100 : 0;

  // Detect vehicle completion for confetti
  useEffect(() => {
    const currentComplete = completed;
    if (currentComplete > prevCompleteRef.current && currentComplete > 0) {
      setShowConfetti(true);
      playSound(settings.soundEnabled, sounds.vehicleComplete);
      haptics.success();
    }
    prevCompleteRef.current = currentComplete;
  }, [completed, settings.soundEnabled]);

  // Detect fleet complete
  useEffect(() => {
    if (completed === 3) {
      setShowComplete(true);
    }
  }, [completed]);

  const isUnlocked = (i: number): boolean => {
    if (i === 0) return true;
    return state.vehicles[i - 1].ready;
  };

  const handleAddFuel = (vehicleId?: number) => {
    setTxModal({ type: 'fuel', open: true, vehicleId });
  };

  const handleBurnout = () => {
    setTxModal({ type: 'burnout', open: true });
  };

  // Daily briefing
  const today = new Date().toDateString();
  const showBriefing = state.lastBriefingDate !== today;

  return (
    <div className="min-h-screen pb-28">
      {/* Confetti */}
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Fleet Complete overlay */}
      {showComplete && (
        <FleetCompleteOverlay
          monthlyIncome={monthlyIncome}
          onClose={() => setShowComplete(false)}
        />
      )}

      {/* Daily Briefing */}
      {showBriefing && state.firstDepositMade && (
        <DailyBriefing
          fleetPct={fleetPct}
          v1Pct={state.vehicles[0] ? vehicleOverallPct(state.vehicles[0], settings.vehicles[0]) : 0}
          streak={state.streak.count}
          milestone={milestone}
          settings={settings}
        />
      )}

      {/* Hero header */}
      <div className="px-4 pt-3 pb-4" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">FLEET HQ</h1>
            <p className="text-xs text-zinc-500 tracking-wider">FLEET LEVEL {String(level.level).padStart(2, '0')} — {level.name}</p>
          </div>
          <button
            onClick={() => setShowAchievements(true)}
            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 active:scale-95 transition-transform"
          >
            <Trophy size={14} className="text-amber-400" />
            <span className="text-xs font-bold text-zinc-300">{state.xp.toLocaleString()} XP</span>
          </button>
        </div>

        {/* XP progress */}
        <div className="mb-4">
          <ProgressBar pct={level.progress * 100} color="#f59e0b" height={3} />
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <GlassCard className="p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Fleet Progress</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">
                <RollingNumber value={completed} />
              </span>
              <span className="text-sm text-zinc-600 font-bold">/ 3</span>
            </div>
            <span className="text-[10px] text-zinc-600">Vehicles</span>
          </GlassCard>

          <GlassCard className="p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Fleet Value</span>
            </div>
            <div className="text-xl font-black text-emerald-400">
              <RollingNumber value={value} formatFn={(n) => formatMoney(n, settings)} />
            </div>
          </GlassCard>

          <GlassCard className="p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={10} className="text-emerald-400" />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Monthly Income</span>
            </div>
            <div className="text-xl font-black text-emerald-400">
              <RollingNumber value={monthlyIncome} formatFn={(n) => formatMoney(n, settings)} />
            </div>
          </GlassCard>

          <GlassCard className="p-3.5" glow={freedom >= 30} glowColor="rgba(245,158,11,0.1)">
            <div className="flex items-center gap-1.5 mb-1">
              <Sun size={10} className="text-amber-400" />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Freedom</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-400">
                <RollingNumber value={freedom} />
              </span>
              <span className="text-xs text-zinc-600 font-bold">DAYS</span>
            </div>
          </GlassCard>
        </div>

        {/* Build streak + Trading allocated */}
        <div className="flex gap-2.5 mb-3">
          {state.streak.count > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1.5">
              <span className="text-sm">🔥</span>
              <span className="text-xs font-bold text-orange-300">BUILD STREAK: {state.streak.count} DAYS</span>
            </div>
          )}
          {tradingAllocated > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
              <Zap size={12} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">TRADING: {formatMoney(tradingAllocated, settings, { compact: true })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Garage */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-zinc-400 tracking-widest">THE GARAGE</h2>
          <span className="text-xs text-zinc-600">{completed}/3 Acquired</span>
        </div>

        {/* Garage environment */}
        <div
          className="rounded-3xl border border-white/[0.06] overflow-hidden mb-4 relative transition-all duration-1000"
          style={{
            background: `linear-gradient(180deg,
              rgba(${fleetPct > 0 ? '20,20,20' : '10,10,10'}) 0%,
              rgba(${fleetPct > 50 ? '15,15,15' : '8,8,8'}) 100%)`,
            boxShadow: fleetPct > 0 ? `inset 0 0 ${40 + fleetPct * 0.6}px rgba(34,197,94,${0.02 + fleetPct * 0.0008})` : 'none',
          }}
        >
          {/* Ceiling lights */}
          <div className="flex justify-around pt-3 pb-1">
            {[0, 1, 2].map(i => {
              const on = completed >= i + 1 || (i === 0 && fleetPct > 5);
              return (
                <div
                  key={i}
                  className="w-12 h-0.5 rounded-full transition-all duration-1000"
                  style={{
                    background: on ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.05)',
                    boxShadow: on ? '0 0 15px rgba(34,197,94,0.3), 0 8px 30px rgba(34,197,94,0.1)' : 'none',
                  }}
                />
              );
            })}
          </div>

          {/* Parking bays */}
          <div className="px-3 pb-4 space-y-2">
            {state.vehicles.map((v, i) => {
              const cfg = settings.vehicles[i];
              const unlocked = isUnlocked(i);
              const pct = vehicleOverallPct(v, cfg);
              const stage: VehicleStage = vehicleStage(v, cfg);

              return (
                <div
                  key={v.id}
                  className={`relative rounded-2xl border transition-all duration-500 ${
                    unlocked
                      ? 'border-white/[0.08] bg-white/[0.02] cursor-pointer active:scale-[0.99]'
                      : 'border-white/[0.03] bg-black/40'
                  }`}
                  onClick={() => unlocked && setDetailVehicle(i)}
                >
                  {/* Bay label */}
                  <div className="flex items-center justify-between px-4 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-600 tracking-widest">BAY {String(i + 1).padStart(2, '0')}</span>
                      {v.ready && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          EARNING
                        </span>
                      )}
                    </div>
                    {!unlocked && <Lock size={14} className="text-zinc-700" />}
                  </div>

                  {unlocked ? (
                    <>
                      {/* Vehicle visualization */}
                      <div className="flex flex-col items-center py-2">
                        <div className={`transition-all duration-700 ${stage === 'ACQUIRED' ? 'drop-shadow-[0_0_15px_rgba(34,197,94,0.2)]' : ''}`}>
                          <VehicleSVG stage={stage} progress={pct} size={180} />
                        </div>

                        {/* Vehicle name */}
                        <div className="text-center mt-1">
                          <span className="text-sm font-bold text-white">{v.name}</span>
                        </div>

                        {/* Stage label */}
                        <div className="text-center mt-0.5">
                          <span className={`text-[10px] font-bold tracking-widest ${
                            stage === 'ACQUIRED' ? 'text-emerald-400' : 'text-zinc-600'
                          }`}>
                            {stage.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full px-4 mt-2">
                          <ProgressBar
                            pct={pct}
                            color={stage === 'ACQUIRED' ? '#22c55e' : '#3b82f6'}
                            height={4}
                            glow={stage === 'ACQUIRED'}
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-zinc-600">{pct.toFixed(0)}%</span>
                            <span className="text-[10px] text-zinc-600">{formatMoney(v.savedNAD + v.deploymentSavedNAD, settings, { compact: true })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end px-4 pb-2">
                        <ChevronRight size={14} className="text-zinc-600" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center py-8 opacity-50">
                      <div className="w-24 h-20 rounded-xl border border-dashed border-zinc-700/50 flex items-center justify-center mb-2">
                        <Lock size={20} className="text-zinc-700" />
                      </div>
                      <span className="text-[10px] text-zinc-600 font-semibold animate-pulse">
                        LOCKED UNTIL VEHICLE {String(i).padStart(2, '0')} IS COMPLETE
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Floor reflection */}
          {completed > 0 && (
            <div
              className="h-8 transition-all duration-1000"
              style={{
                background: 'linear-gradient(180deg, rgba(34,197,94,0.03) 0%, transparent 100%)',
              }}
            />
          )}
        </div>

        {/* Next milestone */}
        {milestone && (
          <GlassCard className="p-4 mb-3" glow glowColor="rgba(34,197,94,0.08)">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Next Milestone</span>
              <span className="text-[10px] text-emerald-400 font-bold">{milestone.pct.toFixed(0)}%</span>
            </div>
            <p className="text-sm font-bold text-white mb-2">🚗 {milestone.label}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-black text-emerald-400">{formatMoney(milestone.remainingNAD, settings)}</span>
              <span className="text-xs text-zinc-600">remaining</span>
            </div>
            <ProgressBar pct={milestone.pct} color="#22c55e" height={4} className="mt-2" />
          </GlassCard>
        )}

        {/* Fleet progress overview */}
        <GlassCard className="p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Fleet Goal</span>
            <span className="text-xs text-zinc-600">{fleetPct.toFixed(0)}%</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-lg font-bold text-white">{formatMoney(balance, settings)}</span>
            <span className="text-sm text-zinc-600">/ {formatMoney(goal, settings)}</span>
          </div>
          <ProgressBar pct={fleetPct} color="#22c55e" height={6} glow />
        </GlassCard>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => handleAddFuel()}
            className="relative group active:scale-[0.97] transition-transform"
          >
            <div className="bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 rounded-2xl py-4 flex flex-col items-center gap-1 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
              <Fuel size={26} className="text-emerald-400" />
              <span className="text-sm font-black text-emerald-300 tracking-wider">ADD FUEL</span>
            </div>
          </button>
          <button
            onClick={handleBurnout}
            className="relative group active:scale-[0.97] transition-transform"
          >
            <div className="bg-gradient-to-b from-orange-500/20 to-orange-500/5 border border-orange-500/30 rounded-2xl py-4 flex flex-col items-center gap-1 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
              <Flame size={26} className="text-orange-400" />
              <span className="text-sm font-black text-orange-300 tracking-wider">BURNOUT</span>
            </div>
          </button>
        </div>

        {/* Fleet tools */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <ToolButton icon="TrendingUp" label="FLEET FORECAST" onClick={() => setShowForecast(true)} />
          <ToolButton icon="Zap" label="WHAT IF?" onClick={() => setShowWhatIf(true)} />
          <ToolButton icon="RotateCw" label="REINVESTMENT" onClick={() => setShowReinvest(true)} />
          <ToolButton icon="BarChart3" label="BUSINESS" onClick={() => setShowBusiness(true)} />
        </div>
      </div>

      {/* Empty state */}
      {!state.firstDepositMade && (
        <div className="px-4 pb-8">
          <GlassCard className="p-6 text-center" glow glowColor="rgba(34,197,94,0.08)">
            <p className="text-sm font-bold text-zinc-300 mb-1">THE GARAGE IS WAITING.</p>
            <p className="text-xs text-zinc-500 mb-4">Your first vehicle starts with the first drop of fuel.</p>
            <button
              onClick={() => handleAddFuel()}
              className="w-full py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-sm tracking-wide active:scale-95 transition-transform shadow-[0_0_20px_rgba(34,197,94,0.2)]"
            >
              ⛽ ADD FIRST FUEL
            </button>
          </GlassCard>
        </div>
      )}

      {/* Modals */}
      <TransactionModal
        type={txModal.type}
        open={txModal.open}
        onClose={() => setTxModal({ ...txModal, open: false })}
        vehicleId={txModal.vehicleId}
      />
      {detailVehicle !== null && (
        <VehicleDetail
          vehicleId={detailVehicle}
          open={true}
          onClose={() => setDetailVehicle(null)}
        />
      )}
      <FleetForecast open={showForecast} onClose={() => setShowForecast(false)} />
      <WhatIfSimulator open={showWhatIf} onClose={() => setShowWhatIf(false)} />
      <ReinvestmentEngine open={showReinvest} onClose={() => setShowReinvest(false)} />
      <AchievementsView open={showAchievements} onClose={() => setShowAchievements(false)} />
      <BusinessMetrics open={showBusiness} onClose={() => setShowBusiness(false)} />
    </div>
  );
}

function ToolButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  const icons: Record<string, React.ReactNode> = {
    TrendingUp: <TrendingUp size={18} className="text-emerald-400" />,
    Zap: <Zap size={18} className="text-amber-400" />,
    RotateCw: <RotateCw size={18} className="text-cyan-400" />,
    BarChart3: <BarChart3 size={18} className="text-blue-400" />,
  };
  return (
    <button
      onClick={onClick}
      className="bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 px-3 flex items-center gap-2.5 active:scale-95 transition-transform"
    >
      {icons[icon]}
      <span className="text-[11px] font-bold text-zinc-300 tracking-wider">{label}</span>
    </button>
  );
}

function DailyBriefing({ fleetPct, v1Pct, streak, milestone, settings }: {
  fleetPct: number;
  v1Pct: number;
  streak: number;
  milestone: { label: string; remainingNAD: number; pct: number } | null;
  settings: Settings;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  return (
    <div className="px-4 pt-2 pb-2" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
      <div className="bg-gradient-to-r from-emerald-500/10 via-white/[0.03] to-transparent border border-emerald-500/15 rounded-2xl p-4 animate-[fadeIn_0.5s_ease-out]">
        <h3 className="text-sm font-black text-emerald-300 tracking-wide mb-1">{greeting}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Your fleet is {fleetPct.toFixed(0)}% built.<br />
          Vehicle 01 is {v1Pct.toFixed(0)}% complete.<br />
          {streak > 0 && <>You're on a {streak}-day build streak.<br /></>}
          {milestone && <span className="text-emerald-400 font-semibold">{formatMoney(milestone.remainingNAD, settings)} remaining until {milestone.label}.</span>}
        </p>
      </div>
    </div>
  );
}

function FleetCompleteOverlay({ monthlyIncome, onClose }: {
  monthlyIncome: number;
  onClose: () => void;
}) {
  const settings = useFleet().state.settings;
  const annual = monthlyIncome * 12;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-[fadeIn_0.5s_ease-out] p-6">
      <Confetti active={true} />
      <div className="text-center max-w-sm">
        <h1 className="text-3xl font-black text-emerald-400 tracking-tight mb-4 animate-[slideUp_0.5s_ease-out]">
          FLEET COMPLETE
        </h1>
        <div className="text-5xl mb-4">🚗 🚗 🚗</div>
        <p className="text-lg font-bold text-white mb-1">3 / 3 VEHICLES</p>
        <p className="text-sm text-emerald-400 font-semibold mb-6">FLEET OPERATIONAL</p>

        <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-5 mb-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Projected Monthly Income</p>
          <p className="text-3xl font-black text-emerald-400 mb-3">{formatMoney(monthlyIncome, settings)}</p>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Projected Annual Income</p>
          <p className="text-2xl font-black text-white">{formatMoney(annual, settings)}</p>
        </div>

        <p className="text-sm text-zinc-400 italic mb-6 leading-relaxed">
          "You didn't just save money.<br />You built an income engine."
        </p>

        <button
          onClick={onClose}
          className="px-8 py-3 rounded-xl bg-emerald-500 text-black font-bold active:scale-95 transition-transform"
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}
