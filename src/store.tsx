import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';

import type {
  FleetState,
  Settings,
  Transaction,
  TransactionSource,
  VehicleConfig,
  VehicleState,
} from './types';

import {
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  XP_REWARDS,
} from './constants';

import {
  defaultFleetState,
  isToday,
  makeVehicle,
} from './utils/fleet';

const XP_ACHIEVEMENT_MAP: Record<string, number> = {
  first_fuel: XP_REWARDS.firstDeposit,
  first_1000: XP_REWARDS.savingsMilestone,
  halfway: XP_REWARDS.vehicleHalf,
  fully_built: XP_REWARDS.vehicleComplete,
  first_fleet: XP_REWARDS.savingsMilestone,
  triple_threat: XP_REWARDS.allComplete,
  thirty_days: XP_REWARDS.savingsMilestone,
  consistency: XP_REWARDS.savingsMilestone,
};

type Action =
  | { type: 'HYDRATE'; state: FleetState }
  | {
      type: 'ADD_FUEL';
      amountNAD: number;
      note?: string;
      source?: TransactionSource;
      vehicleId?: number;
    }
  | {
      type: 'BURNOUT';
      amountNAD: number;
      note?: string;
      vehicleId?: number;
    }
  | {
      type: 'RENAME_VEHICLE';
      vehicleId: number;
      name: string;
    }
  | {
      type: 'TOGGLE_EARNING';
      vehicleId: number;
    }
  | {
      type: 'RECORD_INCOME';
      vehicleId: number;
      amountNAD: number;
    }
  | {
      type: 'UPDATE_SETTINGS';
      partial: Partial<Settings>;
    }
  | {
      type: 'ADD_VEHICLE';
      config: VehicleConfig;
      name?: string;
    }
  | {
      type: 'ADD_XP';
      amount: number;
    }
  | {
      type: 'UNLOCK_ACHIEVEMENT';
      id: string;
    }
  | {
      type: 'UPDATE_STREAK';
      date: string;
    }
  | {
      type: 'SET_BRIEFING_DATE';
      date: string;
    }
  | {
      type: 'IMPORT_STATE';
      state: FleetState;
    }
  | {
      type: 'CLEAR_NOTIFICATIONS';
    }
  | {
      type: 'RESET';
    };

function uid(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

function allocateFuel(
  state: FleetState,
  amount: number,
  vehicleId?: number
): FleetState {
  const vehicles = state.vehicles.map((v) => ({ ...v }));
  let remaining = amount;

  if (vehicleId !== undefined) {
    const v = vehicles[vehicleId];
    const cfg = state.settings.vehicles[vehicleId];

    if (!v.acquired) {
      const purchaseLeft = cfg.priceNAD - v.savedNAD;
      const toPurchase = Math.min(
        remaining,
        purchaseLeft
      );

      v.savedNAD += toPurchase;
      remaining -= toPurchase;

      if (v.savedNAD >= cfg.priceNAD) {
        v.acquired = true;
      }
    }

    if (remaining > 0 && !v.ready) {
      const deployLeft =
        cfg.deploymentCostNAD -
        v.deploymentSavedNAD;

      const toDeploy = Math.min(
        remaining,
        deployLeft
      );

      v.deploymentSavedNAD += toDeploy;
      remaining -= toDeploy;

      if (
        v.acquired &&
        v.deploymentSavedNAD >=
          cfg.deploymentCostNAD
      ) {
        v.ready = true;
      }
    }
  } else {
    // Auto-allocate to first incomplete vehicle
    for (
      let i = 0;
      i < vehicles.length && remaining > 0;
      i++
    ) {
      const v = vehicles[i];
      const cfg = state.settings.vehicles[i];

      if (v.ready) continue;

      if (!v.acquired) {
        const purchaseLeft =
          cfg.priceNAD - v.savedNAD;

        const toPurchase = Math.min(
          remaining,
          purchaseLeft
        );

        v.savedNAD += toPurchase;
        remaining -= toPurchase;

        if (v.savedNAD >= cfg.priceNAD) {
          v.acquired = true;
        }
      }

      if (remaining > 0 && !v.ready) {
        const deployLeft =
          cfg.deploymentCostNAD -
          v.deploymentSavedNAD;

        const toDeploy = Math.min(
          remaining,
          deployLeft
        );

        v.deploymentSavedNAD += toDeploy;
        remaining -= toDeploy;

        if (
          v.acquired &&
          v.deploymentSavedNAD >=
            cfg.deploymentCostNAD
        ) {
          v.ready = true;
        }
      }
    }
  }

  return {
    ...state,
    vehicles,
  };
}

function deductBurnout(
  state: FleetState,
  amount: number,
  vehicleId?: number
): FleetState {
  const vehicles = state.vehicles.map((v) => ({
    ...v,
  }));

  let remaining = amount;

  // If vehicleId specified, deduct from that vehicle.
  // Otherwise deduct from the most recently funded
  // incomplete vehicle.
  const order =
    vehicleId !== undefined
      ? [vehicleId]
      : vehicles
          .map((_, i) => i)
          .reverse();

  for (const i of order) {
    if (remaining <= 0) break;

    const v = vehicles[i];

    if (
      v.savedNAD +
        v.deploymentSavedNAD <=
      0
    ) {
      continue;
    }

    // Deduct from deployment first,
    // then purchase.
    const fromDeploy = Math.min(
      remaining,
      v.deploymentSavedNAD
    );

    v.deploymentSavedNAD -= fromDeploy;
    remaining -= fromDeploy;

    if (
      v.deploymentSavedNAD <
      state.settings.vehicles[i]
        .deploymentCostNAD
    ) {
      v.ready = false;
    }

    if (remaining > 0) {
      const fromPurchase = Math.min(
        remaining,
        v.savedNAD
      );

      v.savedNAD -= fromPurchase;
      remaining -= fromPurchase;

      if (
        v.savedNAD <
        state.settings.vehicles[i].priceNAD
      ) {
        v.acquired = false;
        v.ready = false;
      }
    }
  }

  return {
    ...state,
    vehicles,
  };
}

function checkAchievements(
  state: FleetState,
  prevState?: FleetState
): {
  state: FleetState;
  unlocked: string[];
  xpGained: number;
} {
  const newlyUnlocked: string[] = [];
  const have = new Set(
    state.unlockedAchievements
  );

  const tryUnlock = (
    id: string,
    cond: boolean
  ) => {
    if (cond && !have.has(id)) {
      have.add(id);
      newlyUnlocked.push(id);
    }
  };

  const totalSaved =
    state.vehicles.reduce(
      (s, v) =>
        s +
        v.savedNAD +
        v.deploymentSavedNAD,
      0
    );

  const v1 = state.vehicles[0];
  const cfg1 =
    state.settings.vehicles[0];

  const v1Pct =
    cfg1.priceNAD > 0
      ? (v1.savedNAD / cfg1.priceNAD) *
        100
      : 0;

  tryUnlock(
    'first_fuel',
    state.firstDepositMade
  );

  tryUnlock(
    'first_1000',
    totalSaved >=
      DEFAULT_SETTINGS.rates.USD_TO_NAD *
        1000
  );

  tryUnlock(
    'halfway',
    v1Pct >= 50
  );

  tryUnlock(
    'fully_built',
    v1.ready
  );

  tryUnlock(
    'first_fleet',
    state.vehicles[1]?.savedNAD > 0 ||
      state.vehicles[1]
        ?.deploymentSavedNAD > 0
  );

  tryUnlock(
    'triple_threat',
    state.vehicles.every(
      (v) => v.ready
    )
  );

  tryUnlock(
    'thirty_days',
    totalSaved /
      (state.settings
        .monthlyFreedomTargetNAD /
        30) >= 30
  );

  tryUnlock(
    'consistency',
    state.streak.count >= 7
  );

  // XP from achievements
  let xpGained =
    newlyUnlocked.reduce(
      (sum, id) =>
        sum +
        (XP_ACHIEVEMENT_MAP[id] || 0),
      0
    );

  // XP from vehicle transitions
  if (prevState) {
    for (
      let i = 0;
      i < state.vehicles.length;
      i++
    ) {
      const cur = state.vehicles[i];
      const prev =
        prevState.vehicles[i];

      if (!prev) continue;

      if (
        !prev.ready &&
        cur.ready
      ) {
        xpGained +=
          XP_REWARDS.vehicleReady;
      }
    }
  }

  const newState: FleetState = {
    ...state,
    unlockedAchievements:
      Array.from(have),
    xp: state.xp + xpGained,
  };

  return {
    state: newState,
    unlocked: newlyUnlocked,
    xpGained,
  };
}

function reducer(
  state: FleetState,
  action: Action
): FleetState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;

    case 'ADD_FUEL': {
      const tx: Transaction = {
        id: uid(),
        type: 'fuel',
        amountNAD:
          action.amountNAD,
        note: action.note,
        source: action.source,
        vehicleId: action.vehicleId,
        date: new Date().toISOString(),
      };

      let newState: FleetState = {
        ...state,
        transactions: [
          tx,
          ...state.transactions,
        ],
        firstDepositMade: true,
      };

      newState = allocateFuel(
        newState,
        action.amountNAD,
        action.vehicleId
      );

      // Update streak
      const today =
        new Date().toISOString();

      if (
        !state.streak
          .lastContributionDate ||
        !isToday(
          state.streak
            .lastContributionDate
        )
      ) {
        const last =
          state.streak
            .lastContributionDate;

        const yesterday =
          new Date();

        yesterday.setDate(
          yesterday.getDate() - 1
        );

        const isConsecutive =
          last &&
          new Date(
            last
          ).toDateString() ===
            yesterday.toDateString();

        newState = {
          ...newState,
          streak: {
            count: isConsecutive
              ? state.streak.count + 1
              : 1,
            lastContributionDate:
              today,
          },
        };
      }

      const result =
        checkAchievements(
          newState,
          state
        );

      const readyVehicleIdx =
        newState.vehicles.findIndex(
          (v, i) =>
            v.ready &&
            !state.vehicles[i]
              ?.ready
        );

      return {
        ...result.state,
        pendingNotifications: {
          achievementIds:
            result.unlocked,
          xpGained:
            result.xpGained,
          vehicleReady:
            readyVehicleIdx >= 0
              ? readyVehicleIdx
              : null,
        },
      };
    }

    case 'BURNOUT': {
      const tx: Transaction = {
        id: uid(),
        type: 'burnout',
        amountNAD:
          action.amountNAD,
        note: action.note,
        vehicleId: action.vehicleId,
        date: new Date().toISOString(),
      };

      let newState: FleetState = {
        ...state,
        transactions: [
          tx,
          ...state.transactions,
        ],
      };

      newState = deductBurnout(
        newState,
        action.amountNAD,
        action.vehicleId
      );

      const result =
        checkAchievements(
          newState,
          state
        );

      return {
        ...result.state,
        pendingNotifications: {
          achievementIds:
            result.unlocked,
          xpGained:
            result.xpGained,
          vehicleReady: null,
        },
      };
    }

    case 'RENAME_VEHICLE':
      return {
        ...state,
        vehicles:
          state.vehicles.map(
            (v) =>
              v.id ===
              action.vehicleId
                ? {
                    ...v,
                    name: action.name,
                  }
                : v
          ),
      };

    case 'TOGGLE_EARNING':
      return {
        ...state,
        vehicles:
          state.vehicles.map(
            (v) =>
              v.id ===
              action.vehicleId
                ? {
                    ...v,
                    earning:
                      !v.earning,
                  }
                : v
          ),
      };

    case 'RECORD_INCOME':
      return {
        ...state,
        vehicles:
          state.vehicles.map(
            (v) =>
              v.id ===
              action.vehicleId
                ? {
                    ...v,
                    actualIncomeNAD:
                      v.actualIncomeNAD +
                      action.amountNAD,
                  }
                : v
          ),
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.partial,
        },
      };

    case 'ADD_VEHICLE': {
      const newId =
        state.vehicles.length > 0
          ? Math.max(
              ...state.vehicles.map(
                (v) => v.id
              )
            ) + 1
          : 1;

      const newVehicle =
        makeVehicle(
          newId,
          action.name
        );

      return {
        ...state,
        vehicles: [
          ...state.vehicles,
          newVehicle,
        ],
        settings: {
          ...state.settings,
          vehicles: [
            ...state.settings
              .vehicles,
            action.config,
          ],
        },
      };
    }

    case 'ADD_XP':
      return {
        ...state,
        xp:
          state.xp +
          action.amount,
      };

    case 'UNLOCK_ACHIEVEMENT':
      if (
        state.unlockedAchievements.includes(
          action.id
        )
      ) {
        return state;
      }

      return {
        ...state,
        unlockedAchievements: [
          ...state.unlockedAchievements,
          action.id,
        ],
      };

    case 'UPDATE_STREAK':
      return {
        ...state,
        streak: {
          count:
            action.date ===
            state.streak
              .lastContributionDate
              ? state.streak.count
              : state.streak.count,
          lastContributionDate:
            action.date,
        },
      };

    case 'SET_BRIEFING_DATE':
      return {
        ...state,
        lastBriefingDate:
          action.date,
      };

    case 'IMPORT_STATE':
      return action.state;

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        pendingNotifications: {
          achievementIds: [],
          xpGained: 0,
          vehicleReady: null,
        },
      };

    case 'RESET':
      return defaultFleetState();

    default:
      return state;
  }
}

export interface FleetContextValue {
  state: FleetState;

  /**
   * True after the initial Fleet state has been
   * restored and the first browser paint is ready.
   */
  isReady: boolean;

  addFuel: (
    amountNAD: number,
    note?: string,
    source?: TransactionSource,
    vehicleId?: number
  ) => void;

  burnout: (
    amountNAD: number,
    note?: string,
    vehicleId?: number
  ) => void;

  renameVehicle: (
    vehicleId: number,
    name: string
  ) => void;

  toggleEarning: (
    vehicleId: number
  ) => void;

  recordIncome: (
    vehicleId: number,
    amountNAD: number
  ) => void;

  updateSettings: (
    partial: Partial<Settings>
  ) => void;

  addVehicle: (
    config: VehicleConfig,
    name?: string
  ) => void;

  clearNotifications: () => void;

  importState: (
    state: FleetState
  ) => void;

  reset: () => void;
}

const FleetContext =
  createContext<FleetContextValue | null>(
    null
  );

function loadState(): FleetState {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return defaultFleetState();
    }

    const parsed =
      JSON.parse(raw) as FleetState;

    const defaults =
      defaultFleetState();

    return {
      ...defaults,
      ...parsed,

      settings: {
        ...DEFAULT_SETTINGS,
        ...parsed.settings,

        rates: {
          ...DEFAULT_SETTINGS.rates,
          ...parsed.settings?.rates,
        },

        vehicles:
          parsed.settings?.vehicles
            ?.length
            ? parsed.settings
                .vehicles
            : DEFAULT_SETTINGS.vehicles,
      },

      vehicles:
        parsed.vehicles?.length
          ? parsed.vehicles
          : defaults.vehicles,

      pendingNotifications: {
        achievementIds: [],
        xpGained: 0,
        vehicleReady: null,
      },
    };
  } catch {
    return defaultFleetState();
  }
}

export function FleetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * IMPORTANT:
   * loadState() runs synchronously here.
   * This means the localStorage state is already
   * available when the provider initializes.
   */
  const [state, dispatch] =
    useReducer(
      reducer,
      undefined as unknown as FleetState,
      loadState
    );

  /*
   * isReady becomes true after React has had
   * an opportunity to render the initial state.
   *
   * This is what allows SplashScreen to wait for
   * the actual Fleet state instead of using an
   * arbitrary loading delay.
   */
  const [isReady, setIsReady] =
    useState(false);

  useEffect(() => {
    const frame =
      requestAnimationFrame(() => {
        setIsReady(true);
      });

    return () =>
      cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch {
      /* ignore */
    }
  }, [state]);

  const addFuel = useCallback(
    (
      amountNAD: number,
      note?: string,
      source?: TransactionSource,
      vehicleId?: number
    ) => {
      dispatch({
        type: 'ADD_FUEL',
        amountNAD,
        note,
        source,
        vehicleId,
      });
    },
    []
  );

  const burnout = useCallback(
    (
      amountNAD: number,
      note?: string,
      vehicleId?: number
    ) => {
      dispatch({
        type: 'BURNOUT',
        amountNAD,
        note,
        vehicleId,
      });
    },
    []
  );

  const renameVehicle = useCallback(
    (
      vehicleId: number,
      name: string
    ) => {
      dispatch({
        type: 'RENAME_VEHICLE',
        vehicleId,
        name,
      });
    },
    []
  );

  const toggleEarning =
    useCallback(
      (vehicleId: number) => {
        dispatch({
          type: 'TOGGLE_EARNING',
          vehicleId,
        });
      },
      []
    );

  const recordIncome =
    useCallback(
      (
        vehicleId: number,
        amountNAD: number
      ) => {
        dispatch({
          type: 'RECORD_INCOME',
          vehicleId,
          amountNAD,
        });
      },
      []
    );

  const updateSettings =
    useCallback(
      (partial: Partial<Settings>) => {
        dispatch({
          type: 'UPDATE_SETTINGS',
          partial,
        });
      },
      []
    );

  const addVehicle = useCallback(
    (
      config: VehicleConfig,
      name?: string
    ) => {
      dispatch({
        type: 'ADD_VEHICLE',
        config,
        name,
      });
    },
    []
  );

  const clearNotifications =
    useCallback(() => {
      dispatch({
        type: 'CLEAR_NOTIFICATIONS',
      });
    }, []);

  const importState =
    useCallback(
      (s: FleetState) => {
        dispatch({
          type: 'IMPORT_STATE',
          state: s,
        });
      },
      []
    );

  const reset = useCallback(() => {
    dispatch({
      type: 'RESET',
    });
  }, []);

  return (
    <FleetContext.Provider
      value={{
        state,
        isReady,
        addFuel,
        burnout,
        renameVehicle,
        toggleEarning,
        recordIncome,
        updateSettings,
        addVehicle,
        clearNotifications,
        importState,
        reset,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const ctx =
    useContext(FleetContext);

  if (!ctx) {
    throw new Error(
      'useFleet must be used within FleetProvider'
    );
  }

  return ctx;
}
