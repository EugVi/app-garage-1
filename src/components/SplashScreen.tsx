import { useEffect, useState } from 'react';
import { Car } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      onComplete();
      return;
    }

    const fadeTimer = setTimeout(() => setFading(true), 1900);
    const doneTimer = setTimeout(onComplete, 2400);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950 max-w-[480px] mx-auto transition-opacity duration-500 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/[0.06] rounded-full blur-3xl" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="w-24 h-24 border-2 border-emerald-500/20 rounded-full"
          style={{ animation: 'splashRing 2s ease-out forwards' }}
        />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="w-24 h-24 border-2 border-emerald-500/15 rounded-full"
          style={{ animation: 'splashRing 2s ease-out 0.3s forwards' }}
        />
      </div>

      <div className="relative" style={{ animation: 'splashLogoIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.15)]">
          <Car size={40} className="text-emerald-400" />
        </div>
      </div>

      <div
        className="mt-6 text-center"
        style={{ animation: 'contentSlideUp 0.6s ease-out 0.6s both' }}
      >
        <h1
          className="text-2xl font-black tracking-tight text-transparent bg-clip-text"
          style={{
            backgroundImage: 'linear-gradient(90deg, #22c55e, #86efac, #22c55e)',
            backgroundSize: '200% auto',
            animation: 'splashShimmer 2s linear infinite',
          }}
        >
          FLEET GARAGE
        </h1>
        <p className="text-[10px] text-zinc-600 font-bold tracking-[0.3em] mt-2">
          BUILD YOUR FLEET
        </p>
      </div>

      <div
        className="absolute bottom-20 w-32 h-0.5 bg-white/5 rounded-full overflow-hidden"
        style={{ animation: 'contentSlideUp 0.5s ease-out 1s both' }}
      >
        <div
          className="h-full bg-emerald-500 rounded-full"
          style={{ animation: 'splashBar 1.5s ease-out 1s forwards', transformOrigin: 'left' }}
        />
      </div>
    </div>
  );
}
