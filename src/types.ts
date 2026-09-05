export type CurrencyCode = 'NAD' | 'USD' | 'AOA';

export type VehicleStage = 'BLUEPRINT' | 'ASSEMBLY' | 'FINAL_ASSEMBLY' | 'ACQUIRED';

export type VehicleStatus = 'BUILDING' | 'ACQUIRED' | 'DEPLOYING' | 'READY' | 'EARNING';

export type TransactionType = 'fuel' | 'burnout';

export type TransactionSource = 'Trading Profit' | 'Business Income' | 'Salary' | 'Other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amountNAD: number;
  note?: string;
  source?: TransactionSource;
  vehicleId?: number;
  date: string; // ISO
}

export interface VehicleConfig {
  priceNAD: number;
  deploymentCostNAD: number;
}

export interface VehicleState {
  id: number;
  name: string;
  savedNAD: number;        // allocated toward purchase
  deploymentSavedNAD: number; // allocated toward deployment
  acquired: boolean;       // purchase fully funded
  ready: boolean;          // purchase + deployment fully funded
  earning: boolean;        // manually marked as earning
  actualIncomeNAD: number; // recorded actual income
}

export interface Settings {
  currency: CurrencyCode;
  rates: {
    USD_TO_NAD: number;
    USD_TO_AOA: number;
    NAD_TO_AOA: number;
  };
  vehicles: [VehicleConfig, VehicleConfig, VehicleConfig];
  monthlyIncomePerVehicleNAD: number;
  monthlyFreedomTargetNAD: number;
  reinvestmentPct: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export interface FleetState {
  transactions: Transaction[];
  vehicles: VehicleState[];
  settings: Settings;
  xp: number;
  unlockedAchievements: string[];
  streak: { count: number; lastContributionDate: string | null };
  lastBriefingDate: string | null;
  firstDepositMade: boolean;
  createdAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
}
