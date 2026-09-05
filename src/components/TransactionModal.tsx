import { useEffect, useState } from 'react';
import { Fuel, Flame, Check } from 'lucide-react';
import { Modal } from './Modal';
import { useFleet } from '../store';
import type { TransactionSource } from '../types';
import { CURRENCY_META, TRANSACTION_SOURCES } from '../constants';
import { convertToNAD } from '../utils/currency';
import { sounds, playSound } from '../utils/sound';
import { haptics } from '../utils/haptics';

interface TransactionModalProps {
  type: 'fuel' | 'burnout';
  open: boolean;
  onClose: () => void;
  vehicleId?: number;
}

export function TransactionModal({ type, open, onClose, vehicleId }: TransactionModalProps) {
  const { state, addFuel, burnout } = useFleet();
  const { settings } = state;
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [source, setSource] = useState<TransactionSource>('Trading Profit');
  const [showSmoke, setShowSmoke] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount('');
      setNote('');
      setSource('Trading Profit');
      setShowSmoke(false);
    }
  }, [open]);

  const isFuel = type === 'fuel';
  const accent = isFuel ? 'green' : 'orange';
  const symbol = CURRENCY_META[settings.currency].symbol;

  const displayAmount = parseFloat(amount) || 0;
  const nadAmount = convertToNAD(displayAmount, settings.currency, settings.rates);

  const handleConfirm = () => {
    if (displayAmount <= 0) return;

    if (isFuel) {
      addFuel(nadAmount, note || undefined, source, vehicleId);
      playSound(settings.soundEnabled, sounds.deposit);
      haptics.success();
    } else {
      // Show smoke animation first, then confirm
      setShowSmoke(true);
      haptics.warning();
      playSound(settings.soundEnabled, sounds.burnout);
      setTimeout(() => {
        burnout(nadAmount, note || undefined, vehicleId);
        setShowSmoke(false);
        onClose();
      }, 600);
      return;
    }
    onClose();
  };

  const quickAmounts = settings.currency === 'NAD'
    ? [500, 1000, 2500, 5000]
    : settings.currency === 'USD'
    ? [25, 50, 100, 250]
    : [5000, 10000, 25000, 50000];

  return (
    <Modal open={open} onClose={onClose} accent={accent}>
      {/* Smoke effect for burnout */}
      {showSmoke && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-t-3xl sm:rounded-3xl">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gray-400/30"
              style={{
                width: `${20 + Math.random() * 30}px`,
                height: `${20 + Math.random() * 30}px`,
                left: `${20 + Math.random() * 60}%`,
                bottom: '20%',
                animation: `smokeRise ${0.6 + Math.random() * 0.3}s ease-out forwards`,
                animationDelay: `${Math.random() * 0.2}s`,
              }}
            />
          ))}
          {/* Skid marks */}
          <div
            className="absolute bottom-[30%] left-1/2 -translate-x-1/2 text-4xl opacity-0"
            style={{ animation: 'skidMark 0.4s ease-out forwards' }}
          >
            💨
          </div>
        </div>
      )}

      <div className="flex flex-col items-center mb-6">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${
            isFuel ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400'
          }`}
          style={{ boxShadow: isFuel ? '0 0 20px rgba(34,197,94,0.2)' : '0 0 20px rgba(249,115,22,0.2)' }}
        >
          {isFuel ? <Fuel size={28} /> : <Flame size={28} />}
        </div>
        <h2 className="text-xl font-bold text-white tracking-wide">
          {isFuel ? 'ADD FUEL' : 'BURNOUT'}
        </h2>
        {!isFuel && (
          <p className="text-xs text-orange-300/70 mt-1 text-center">This will remove fuel from your fleet.</p>
        )}
      </div>

      {/* Amount display */}
      <div className="text-center mb-5">
        <div className={`text-4xl font-black tracking-tight ${isFuel ? 'text-emerald-400' : 'text-orange-400'}`}>
          {amount ? `${symbol}${displayAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : `${symbol}0`}
        </div>
      </div>

      {/* Amount input */}
      <div className="mb-3">
        <input
          type="number"
          inputMode="decimal"
          placeholder="Enter amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-lg font-semibold placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
          autoFocus
        />
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {quickAmounts.map(amt => (
          <button
            key={amt}
            onClick={() => setAmount(amt.toString())}
            className={`py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
              isFuel
                ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20'
                : 'bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 border border-orange-500/20'
            }`}
          >
            {symbol}{amt.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Source selector (fuel only) */}
      {isFuel && (
        <div className="mb-4">
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Source</label>
          <div className="grid grid-cols-2 gap-2">
            {TRANSACTION_SOURCES.map(s => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                  source === s
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/5 text-zinc-400 border border-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Note */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Optional note (e.g. January trading profits)"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
        />
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={displayAmount <= 0 || showSmoke}
        className={`w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100 ${
          isFuel
            ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
            : 'bg-orange-500 text-black hover:bg-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
        }`}
      >
        {showSmoke ? 'BURNING...' : <span className="flex items-center justify-center gap-2"><Check size={18} /> CONFIRM</span>}
      </button>
    </Modal>
  );
}
