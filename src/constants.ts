import type { Achievement, CurrencyCode, Settings } from './types';

export const STORAGE_KEY = 'fleet-garage-state-v1';

export const DEFAULT_SETTINGS: Settings = {
  currency: 'NAD',
  rates: {
    USD_TO_NAD: 18.5,
    USD_TO_AOA: 830.0,
    NAD_TO_AOA: 44.86,
  },
  vehicles: [
    { priceNAD: 85000, deploymentCostNAD: 8000 },
    { priceNAD: 85000, deploymentCostNAD: 8000 },
    { priceNAD: 85000, deploymentCostNAD: 8000 },
  ],
  monthlyIncomePerVehicleNAD: 8000,
  monthlyFreedomTargetNAD: 8000,
  reinvestmentPct: 80,
  soundEnabled: true,
  hapticsEnabled: true,
};

export const CURRENCY_META: Record<CurrencyCode, { symbol: string; label: string; code: string }> = {
  NAD: { symbol: 'N$', label: 'Namibian Dollar', code: 'NAD' },
  USD: { symbol: '$', label: 'US Dollar', code: 'USD' },
  AOA: { symbol: 'Kz', label: 'Angolan Kwanza', code: 'AOA' },
};

export const TRANSACTION_SOURCES = ['Trading Profit', 'Business Income', 'Salary', 'Other'] as const;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_fuel', name: 'First Fuel', description: 'Make your first deposit.', icon: 'Fuel' },
  { id: 'first_1000', name: 'First $1,000', description: 'Reach the equivalent of $1,000 saved.', icon: 'Medal' },
  { id: 'halfway', name: 'Halfway There', description: 'Reach 50% of Vehicle 01.', icon: 'TrendingUp' },
  { id: 'fully_built', name: 'Fully Built', description: 'Complete Vehicle 01.', icon: 'Car' },
  { id: 'first_fleet', name: 'First Fleet', description: 'Unlock Vehicle 02.', icon: 'Unlock' },
  { id: 'triple_threat', name: 'Triple Threat', description: 'Complete all three vehicles.', icon: 'Trophy' },
  { id: 'thirty_days', name: '30 Days', description: 'Reach 30 Freedom Days.', icon: 'Sun' },
  { id: 'consistency', name: 'Consistency', description: 'Contribute for 7 consecutive active days.', icon: 'Flame' },
];

export const FLEET_LEVELS = [
  { level: 1, name: 'Solo Operator', minXp: 0 },
  { level: 2, name: 'First Vehicle', minXp: 500 },
  { level: 3, name: 'Fleet Builder', minXp: 1500 },
  { level: 4, name: 'Fleet Operator', minXp: 3500 },
  { level: 5, name: 'Transport Entrepreneur', minXp: 8000 },
];

export const XP_REWARDS = {
  firstDeposit: 100,
  savingsMilestone: 250,
  vehicleHalf: 500,
  vehicleComplete: 1000,
  vehicleReady: 1500,
  allComplete: 5000,
};
