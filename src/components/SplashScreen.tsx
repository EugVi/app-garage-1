import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { Car } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  isAppReady: boolean;
}

export function SplashScreen({
  onComplete,
  isAppReady,
}: SplashScreenProps) {
  const [started, setStarted] =
    useState(false);

  const [fading, setFading] =
    useState(false);

  const startTimeRef =
    useRef<number | null>(null);

  const completedRef =
    useRef(false);

  /*
   * Minimum amount of time the splash
   * remains visible.
   */
  const MIN_SPLASH_TIME = 5500;

  /*
   * Fade-out duration.
   */
  const FADE_TIME = 800;

  /*
   * Start the animation only after the
   * browser has had a chance to paint
   * the splash screen.
   */
  useEffect(() => {
    // Força um delay para garantir que o DOM está pronto
    const initTimer = setTimeout(() => {
      if (startTimeRef.current === null) {
        startTimeRef.current = performance.now();
        setStarted(true);
      }
    }, 200);

    const frame1 = requestAnimationFrame(() => {
      const frame2 = requestAnimationFrame(() => {
        const frame3 = requestAnimationFrame(() => {
          if (startTimeRef.current === null) {
            startTimeRef.current = performance.now();
            setStarted(true);
          }
        });
      });
    });

    return () => {
      clearTimeout(initTimer);
      cancelAnimationFrame(frame1);
    };
  }, []);

  /*
   * Finish only when:
   * 1. Animation has started
   * 2. Fleet Garage is ready
   * 3. Minimum splash duration elapsed
   */
  useEffect(() => {
    if (
      !started ||
      !isAppReady ||
      completedRef.current
    ) {
      return;
    }

    const startedAt =
      startTimeRef.current ??
      performance.now();

    const elapsed =
      performance.now() - startedAt;

    const remaining = Math.max(
      0,
      MIN_SPLASH_TIME - elapsed
    );

    const finishTimer = setTimeout(() => {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;
      setFading(true);

      const completeTimer = setTimeout(() => {
        onComplete();
      }, FADE_TIME);

      return () => clearTimeout(completeTimer);
    }, remaining);

    return () => clearTimeout(finishTimer);
  }, [started, isAppReady, onComplete]);

  /*
   * Helper for CSS animations com fallback para mobile
   */
  const anim = (animation: string, delay: number = 0) => {
    if (!started) {
      return {
        opacity: 0,
        transform: 'scale(0.5)',
        transition: 'none',
      };
    }

    // Para mobile, usamos transições em vez de animações complexas
    const isMobile = /iPhone|iPad|iPod|Android/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      return {
        opacity: 1,
        transform: 'scale(1)',
        transition: `all 0.6s ease-out ${delay}ms`,
      };
    }

    return {
      animation,
    };
  };

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950 max-w-[480px] mx-auto transition-opacity ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        transitionDuration: `${FADE_TIME}ms`,
        WebkitTransitionDuration: `${FADE_TIME}ms`,
      }}
    >
      {/* Estilos CSS inline para garantir funcionamento */}
      <style>
        {`
          @keyframes splashRing {
            0% {
              transform: scale(0.8);
              opacity: 1;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }

          @keyframes splashLogoIn {
            0% {
              transform: scale(0.5) translateY(10px);
              opacity: 0;
            }
            100% {
              transform: scale(1) translateY(0);
              opacity: 1;
            }
          }

          @keyframes contentSlideUp {
            0% {
              transform: translateY(20px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes splashBar {
            0% {
              width: 0%;
            }
            100% {
              width: 100%;
            }
          }

          @keyframes splashShimmer {
            0% {
              background-position: 0% center;
            }
            100% {
              background-position: -200% center;
            }
          }

          /* Classes específicas para mobile */
          @media (max-width: 768px) {
            .splash-animation {
              animation-duration: 3.5s !important;
              animation-fill-mode: forwards !important;
            }
          }
        `}
      </style>

      {/* =========================
          AMBIENT GLOW
          ========================= */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/[0.06] rounded-full blur-3xl"
        style={anim('splashRing 3.5s ease-out forwards')}
      />

      {/* =========================
          OUTER RING
          ========================= */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="w-24 h-24 border-2 border-emerald-500/20 rounded-full splash-animation"
          style={anim('splashRing 3.5s ease-out forwards')}
        />
      </div>

      {/* =========================
          SECOND RING
          ========================= */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="w-24 h-24 border-2 border-emerald-500/15 rounded-full splash-animation"
          style={anim('splashRing 3.5s ease-out 0.5s forwards')}
        />
      </div>

      {/* =========================
          LOGO
          ========================= */}
      <div
        className="relative splash-animation"
        style={anim('splashLogoIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards')}
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.15)]">
          <Car
            size={40}
            className="text-emerald-400"
          />
        </div>
      </div>

      {/* =========================
          BRAND
          ========================= */}
      <div
        className="mt-6 text-center splash-animation"
        style={anim('contentSlideUp 1s ease-out 1s both', 700)}
      >
        <h1
          className="text-2xl font-black tracking-tight text-transparent bg-clip-text"
          style={{
            backgroundImage: 'linear-gradient(90deg, #22c55e, #86efac, #22c55e)',
            backgroundSize: '200% auto',
            ...(started
              ? {
                  animation: 'splashShimmer 2.5s linear infinite',
                  WebkitAnimation: 'splashShimmer 2.5s linear infinite',
                }
              : {}),
          }}
        >
          FLEET GARAGE
        </h1>

        <p className="text-[10px] text-zinc-600 font-bold tracking-[0.3em] mt-2">
          BUILD YOUR FLEET
        </p>
      </div>

      {/* =========================
          LOADING BAR
          ========================= */}
      <div
        className="absolute bottom-20 w-32 h-0.5 bg-white/5 rounded-full overflow-hidden splash-animation"
        style={anim('contentSlideUp 0.8s ease-out 1.5s both', 1100)}
      >
        <div
          className="h-full bg-emerald-500 rounded-full"
          style={
            started
              ? {
                  animation: 'splashBar 4s ease-in-out 1.5s forwards',
                  WebkitAnimation: 'splashBar 4s ease-in-out 1.5s forwards',
                }
              : { width: '0%' }
          }
        />
      </div>
    </div>
  );
}
