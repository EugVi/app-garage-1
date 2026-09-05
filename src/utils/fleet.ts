import type { FleetState, Settings, VehicleConfig, VehicleState } from '../types';
import { DEFAULT_SETTINGS, INITIAL_VEHICLE_COUNT } from '../constants';

export function makeVehicle(id: number, name?: string): VehicleState {
  return {
    id,
    name: name ?? `Vehicle ${String(id).padStart(2, '0')}`,
    savedNAD: 0,
    deploymentSavedNAD: 0,
    acquired: false,
    ready: false,
    earning: false,
    actualIncomeNAD: 0,
  };
}

export function emptyVehicles(): VehicleState[] {
  const names = ['The Pioneer', 'Vehicle 02', 'Vehicle 03'];
  return Array.from({ length: INITIAL_VEHICLE_COUNT }, (_, i) => makeVehicle(i + 1, names[i]));
}

export function defaultFleetState(): FleetState {
  return {
    transactions: [],
    vehicles: emptyVehicles(),
    settings: DEFAULT_SETTINGS,
    xp: 0,
    unlockedAchievements: [],
    streak: { count: 0, lastContributionDate: null },
    lastBriefingDate: null,
    firstDepositMade: false,
    createdAt: new Date().toISOString(),
    pendingNotifications: { achievementIds: [], xpGained: 0, vehicleReady: null },
  };
}

export function totalFleetGoal(settings: Settings): number {
  return settings.vehicles.reduce((sum, v) => sum + v.priceNAD + v.deploymentCostNAD, 0);
}

export function fleetBalance(state: FleetState): number {
  // Total money currently allocated = sum of all saved amounts across vehicles
  return state.vehicles.reduce((sum, v) => sum + v.savedNAD + v.deploymentSavedNAD, 0);
}

export function vehicleOverallPct(v: VehicleState, cfg: VehicleConfig): number {
  const total = cfg.priceNAD + cfg.deploymentCostNAD;
  if (total === 0) return 0;
  const saved = v.savedNAD + v.deploymentSavedNAD;
  return Math.min(100, (saved / total) * 100);
}

export function vehiclePurchasePct(v: VehicleState, cfg: VehicleConfig): number {
  if (cfg.priceNAD === 0) return 0;
  return Math.min(100, (v.savedNAD / cfg.priceNAD) * 100);
}

export function vehicleDeploymentPct(v: VehicleState, cfg: VehicleConfig): number {
  if (cfg.deploymentCostNAD === 0) return 0;
  return Math.min(100, (v.deploymentSavedNAD / cfg.deploymentCostNAD) * 100);
}

export function vehicleStage(v: VehicleState, cfg: VehicleConfig): 'BLUEPRINT' | 'ASSEMBLY' | 'FINAL_ASSEMBLY' | 'ACQUIRED' {
  if (v.ready) return 'ACQUIRED';
  const pct = vehicleOverallPct(v, cfg);
  if (pct >= 70) return 'FINAL_ASSEMBLY';
  if (pct >= 30) return 'ASSEMBLY';
  return 'BLUEPRINT';
}

export function vehicleStatus(v: VehicleState, cfg: VehicleConfig): 'BUILDING' | 'ACQUIRED' | 'DEPLOYING' | 'READY' | 'EARNING' {
  if (v.earning) return 'EARNING';
  if (v.ready) return 'READY';
  const purchaseDone = v.savedNAD >= cfg.priceNAD;
  const deployDone = v.deploymentSavedNAD >= cfg.deploymentCostNAD;
  if (purchaseDone && deployDone) return 'READY';
  if (purchaseDone && !deployDone) return 'DEPLOYING';
  if (purchaseDone) return 'ACQUIRED';
  return 'BUILDING';
}

export function projectedMonthlyIncome(state: FleetState): number {
  const count = activeVehicleCount(state);
  return count * state.settings.monthlyIncomePerVehicleNAD;
}

export function activeVehicleCount(state: FleetState): number {
  return state.vehicles.filter(v => v.ready || v.earning).length;
}

export function completedVehicleCount(state: FleetState): number {
  return state.vehicles.filter(v => v.ready).length;
}

export function allVehiclesComplete(state: FleetState): boolean {
  return state.vehicles.length > 0 && state.vehicles.every(v => v.ready);
}

export function freedomDays(state: FleetState): number {
  const dailyValue = state.settings.monthlyFreedomTargetNAD / 30;
  if (dailyValue <= 0) return 0;
  return Math.floor(fleetBalance(state) / dailyValue);
}

export function fleetValue(state: FleetState): number {
  // total acquisition value of completed/active vehicles
  return state.vehicles.reduce((sum, v, i) => {
    if (v.ready || v.earning) return sum + state.settings.vehicles[i].priceNAD + state.settings.vehicles[i].deploymentCostNAD;
    return sum;
  }, 0);
}

export function nextMilestone(state: FleetState): { label: string; remainingNAD: number; pct: number } | null {
  const { vehicles, settings } = state;
  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i];
    const cfg = settings.vehicles[i];
    if (v.ready) continue;
    const total = cfg.priceNAD + cfg.deploymentCostNAD;
    const saved = v.savedNAD + v.deploymentSavedNAD;
    const remaining = total - saved;
    const pct = vehicleOverallPct(v, cfg);
    const stage = vehicleStage(v, cfg);
    const num = i + 1;
    return {
      label: `VEHICLE ${String(num).padStart(2, '0')} — ${stage.replace('_', ' ')}`,
      remainingNAD: remaining,
      pct,
    };
  }
  return null;
}

export function getFleetLevel(xp: number): { level: number; name: string; minXp: number; nextXp: number | null; progress: number } {
  const levels = [
    { level: 1, name: 'Solo Operator', minXp: 0 },
    { level: 2, name: 'First Vehicle', minXp: 500 },
    { level: 3, name: 'Fleet Builder', minXp: 1500 },
    { level: 4, name: 'Fleet Operator', minXp: 3500 },
    { level: 5, name: 'Transport Entrepreneur', minXp: 8000 },
  ];
  let current = levels[0];
  for (const l of levels) {
    if (xp >= l.minXp) current = l;
  }
  const next = levels.find(l => l.minXp > current.minXp) || null;
  let progress = 1;
  if (next) {
    progress = (xp - current.minXp) / (next.minXp - current.minXp);
  }
  return { ...current, nextXp: next?.minXp ?? null, progress: Math.min(1, Math.max(0, progress)) };
}

export function avgSavingsRate(state: FleetState, days: number = 30): number {
  // average NAD/month based on transaction history
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = state.transactions.filter(t => new Date(t.date).getTime() >= cutoff);
  const totalNAD = recent.reduce((sum, t) => sum + (t.type === 'fuel' ? t.amountNAD : -t.amountNAD), 0);
  return totalNAD; // over the period
}

export function estimatedCompletionDate(monthlySavingsNAD: number, remainingNAD: number): string | null {
  if (monthlySavingsNAD <= 0 || remainingNAD <= 0) return remainingNAD <= 0 ? 'Complete' : null;
  const months = remainingNAD / monthlySavingsNAD;
  const date = new Date();
  date.setMonth(date.getMonth() + Math.ceil(months));
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function isYesterday(iso: string): boolean {
  const d = new Date(iso);
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  return d.toDateString() === yest.toDateString();
}

export function tradingProfitsAllocated(state: FleetState): number {
  return state.transactions
    .filter(t => t.type === 'fuel' && t.source === 'Trading Profit')
    .reduce((sum, t) => sum + t.amountNAD, 0);
}

export function totalDeposited(state: FleetState): number {
  return state.transactions.filter(t => t.type === 'fuel').reduce((s, t) => s + t.amountNAD, 0);
}

export function totalWithdrawn(state: FleetState): number {
  return state.transactions.filter(t => t.type === 'burnout').reduce((s, t) => s + t.amountNAD, 0);
}

export function cumulativeIncome(state: FleetState): number {
  // modeled cumulative income from earning vehicles
  return state.vehicles.reduce((s, v) => s + v.actualIncomeNAD, 0);
}
