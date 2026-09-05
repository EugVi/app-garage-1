import { Modal } from '../components/Modal';
import { useFleet } from '../store';
import { ACHIEVEMENTS } from '../constants';
import { getFleetLevel } from '../utils/fleet';
import { Check, Lock } from 'lucide-react';

interface AchievementsViewProps {
  open: boolean;
  onClose: () => void;
}

export function AchievementsView({ open, onClose }: AchievementsViewProps) {
  const { state } = useFleet();
  const level = getFleetLevel(state.xp);

  return (
    <Modal open={open} onClose={onClose} title="ACHIEVEMENTS">
      {/* Level & XP */}
      <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            Fleet Level {String(level.level).padStart(2, '0')}
          </span>
          <span className="text-xs font-bold text-zinc-400">{state.xp.toLocaleString()} XP</span>
        </div>
        <p className="text-sm font-bold text-white">{level.name}</p>
        {level.nextXp && (
          <p className="text-[10px] text-zinc-500 mt-1">
            {(level.nextXp - state.xp).toLocaleString()} XP to Level {level.level + 1}
          </p>
        )}
        <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${level.progress * 100}%` }} />
        </div>
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map(a => {
          const unlocked = state.unlockedAchievements.includes(a.id);
          return (
            <div
              key={a.id}
              className={`rounded-xl p-3 border transition-all ${
                unlocked
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-white/[0.02] border-white/[0.04]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                unlocked ? 'bg-emerald-500/20' : 'bg-white/5'
              }`}>
                {unlocked ? (
                  <Check size={16} className="text-emerald-400" />
                ) : (
                  <Lock size={14} className="text-zinc-600" />
                )}
              </div>
              <p className={`text-xs font-bold ${unlocked ? 'text-white' : 'text-zinc-600'}`}>{a.name}</p>
              <p className={`text-[10px] mt-0.5 ${unlocked ? 'text-zinc-400' : 'text-zinc-700'}`}>{a.description}</p>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
