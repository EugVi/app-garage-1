```tsx
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Car,
  Scroll,
  Settings,
} from 'lucide-react';

import {
  FleetProvider,
  useFleet,
} from './store';

import { GarageView } from './views/GarageView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { SplashScreen } from './components/SplashScreen';

type Tab =
  | 'garage'
  | 'history'
  | 'settings';

function AppContent() {
  const { isReady } = useFleet();

  const [tab, setTab] =
    useState<Tab>('garage');

  const [showSplash, setShowSplash] =
    useState(true);

  /*
   * Prevents the visibility handler from
   * accidentally triggering multiple splash
   * cycles at the same time.
   */
  const [lastHiddenAt, setLastHiddenAt] =
    useState<number | null>(null);

  const handleSplashComplete =
    useCallback(() => {
      setShowSplash(false);
    }, []);

  /*
   * Handle PWA returning from background.
   *
   * We intentionally wait 30 seconds before
   * showing the splash again. This prevents the
   * splash from appearing every time the user
   * briefly checks WhatsApp or another app.
   */
  useEffect(() => {
    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          'hidden'
        ) {
          setLastHiddenAt(Date.now());
          return;
        }

        if (
          document.visibilityState ===
            'visible' &&
          lastHiddenAt !== null
        ) {
          const hiddenFor =
            Date.now() -
            lastHiddenAt;

          if (hiddenFor >= 30000) {
            setShowSplash(true);
          }

          setLastHiddenAt(null);
        }
      };

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };
  }, [lastHiddenAt]);

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-white max-w-[480px] mx-auto relative overflow-x-hidden">

      {/* =========================
          MAIN APPLICATION
          ========================= */}

      <div
        className={`relative transition-opacity duration-300 ${
          showSplash
            ? 'opacity-100'
            : 'opacity-100'
        }`}
      >
        {tab === 'garage' && (
          <GarageView />
        )}

        {tab === 'history' && (
          <HistoryView />
        )}

        {tab === 'settings' && (
          <SettingsView />
        )}
      </div>

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none max-w-[480px] mx-auto -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/[0.03] rounded-full blur-3xl" />

        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/[0.02] rounded-full blur-3xl" />
      </div>

      {/* =========================
          BOTTOM NAVIGATION
          ========================= */}

      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30"
        style={{
          paddingBottom:
            'env(safe-area-inset-bottom)',
        }}
      >
        <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-white/[0.06] px-4 py-2">
          <div className="grid grid-cols-3 gap-2">

            <TabButton
              active={
                tab === 'garage'
              }
              onClick={() =>
                setTab('garage')
              }
              icon={
                <Car size={22} />
              }
              label="GARAGE"
            />

            <TabButton
              active={
                tab === 'history'
              }
              onClick={() =>
                setTab('history')
              }
              icon={
                <Scroll size={22} />
              }
              label="HISTORY"
            />

            <TabButton
              active={
                tab === 'settings'
              }
              onClick={() =>
                setTab('settings')
              }
              icon={
                <Settings size={22} />
              }
              label="SETTINGS"
            />

          </div>
        </div>
      </nav>

      {/* =========================
          SPLASH SCREEN
          ========================= */}

      {showSplash && (
        <SplashScreen
          isAppReady={isReady}
          onComplete={
            handleSplashComplete
          }
        />
      )}

    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all active:scale-90 ${
        active
          ? 'text-emerald-400'
          : 'text-zinc-600'
      }`}
    >
      <div
        className={`transition-transform ${
          active
            ? 'scale-110'
            : ''
        }`}
      >
        {icon}
      </div>

      <span className="text-[10px] font-bold tracking-wider">
        {label}
      </span>

      {active && (
        <div className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />
      )}
    </button>
  );
}

export default function App() {
  return (
    <FleetProvider>
      <AppContent />
    </FleetProvider>
  );
}
```
