import { useEffect, useState } from 'react';
import { Trophy, Zap, CircleCheck as CheckCircle2 } from 'lucide-react';
import { useFleet } from '../store';
import { ACHIEVEMENTS } from '../constants';
import { sounds, playSound } from '../utils/sound';
import { haptics } from '../utils/haptics';

interface ToastItem {
  id: string;
  type: 'achievement' | 'xp' | 'vehicle';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

export function NotificationToast() {
  const { state, clearNotifications } = useFleet();
  const { pendingNotifications, settings } = state;
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    const { achievementIds, xpGained, vehicleReady } = pendingNotifications;
    if (achievementIds.length === 0 && xpGained === 0 && vehicleReady === null) return;

    setShown(true);
    const items: ToastItem[] = [];

    if (vehicleReady !== null) {
      const v = state.vehicles[vehicleReady];
      items.push({
        id: `vehicle-${Date.now()}`,
        type: 'vehicle',
        title: v ? `${v.name} Ready!` : 'Vehicle Ready!',
        subtitle: 'Your fleet has grown.',
        icon: <CheckCircle2 size={24} className="text-emerald-400" />,
        color: 'border-emerald-500/40 shadow-[0_0_30px_rgba(34,197,94,0.15)]',
      });
    }

    for (const id of achievementIds) {
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) {
        items.push({
          id: `ach-${id}-${Date.now()}`,
          type: 'achievement',
          title: ach.name,
          subtitle: ach.description,
          icon: <Trophy size={24} className="text-amber-400" />,
          color: 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.12)]',
        });
      }
    }

    if (xpGained > 0) {
      items.push({
        id: `xp-${Date.now()}`,
        type: 'xp',
        title: `+${xpGained.toLocaleString()} XP`,
        subtitle: 'Fleet experience gained',
        icon: <Zap size={24} className="text-amber-400" />,
        color: 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.12)]',
      });
    }

    setToasts(items);
    if (items.length > 0) {
      playSound(settings.soundEnabled, sounds.levelUp);
      haptics.levelUp();
    }

    const timer = setTimeout(() => {
      setToasts([]);
      clearNotifications();
      setShown(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, [pendingNotifications, settings.soundEnabled, clearNotifications, shown, state.vehicles]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[120] px-4 space-y-2 pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {toasts.map((t, i) => (
        <div
          key={t.id}
          className={`bg-zinc-900/95 backdrop-blur-xl border ${t.color} rounded-2xl p-3.5 flex items-center gap-3 pointer-events-auto`}
          style={{
            animation: `toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.12}s both`,
          }}
        >
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center">
            {t.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white tracking-wide truncate">{t.title}</p>
            {t.subtitle && <p className="text-[11px] text-zinc-500 truncate">{t.subtitle}</p>}
          </div>
          {t.type === 'achievement' && (
            <div className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5 tracking-wider">
              UNLOCKED
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
