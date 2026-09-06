import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  accent?: 'green' | 'orange' | 'default';
}

export function Modal({ open, onClose, title, children, accent = 'default' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const accentBorder = accent === 'green' ? 'border-emerald-500/30' : accent === 'orange' ? 'border-orange-500/30' : 'border-white/10';
  const accentGlow = accent === 'green' ? 'shadow-[0_-8px_40px_rgba(34,197,94,0.15)]' : accent === 'orange' ? 'shadow-[0_-8px_40px_rgba(249,115,22,0.15)]' : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose} />
      <div
        className={`relative w-full max-w-[480px] bg-zinc-900/95 backdrop-blur-xl border ${accentBorder} ${accentGlow} rounded-t-3xl sm:rounded-3xl p-5 animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] max-h-[90dvh] overflow-y-auto overscroll-contain`}
        style={{
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingTop: '1.25rem',
        }}
      >
        {/* Drag handle for bottom sheet */}
        <div className="sm:hidden flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1 -mr-1">
              <X size={20} />
            </button>
          </div>
        )}
        {!title && (
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1 z-10">
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
