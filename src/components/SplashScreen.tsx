```tsx
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
   *
   * 3500ms = 3.5 seconds.
   */
  const MIN_SPLASH_TIME = 3500;

  /*
   * Fade-out duration.
   */
  const FADE_TIME = 500;

  /*
   * Start the animation only after the
   * browser has had a chance to paint
   * the splash screen.
   */
  useEffect(() => {
    const prefersReduced =
      window.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
      ).matches;

    if (prefersReduced) {
      if (isAppReady) {
        onComplete();
      }

      return;
    }

    const frame1 =
      requestAnimationFrame(() => {
        const frame2 =
          requestAnimationFrame(() => {
            startTimeRef.current =
              performance.now();

            setStarted(true);
          });

        return () =>
          cancelAnimationFrame(
            frame2
          );
      });

    return () =>
      cancelAnimationFrame(
        frame1
      );
  }, [onComplete, isAppReady]);

  /*
   * Finish only when:
   *
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
      performance.now() -
      startedAt;

    const remaining = Math.max(
      0,
      MIN_SPLASH_TIME -
        elapsed
    );

    const finishTimer =
      setTimeout(() => {
        if (
          completedRef.current
        ) {
          return;
        }

        completedRef.current =
          true;

        setFading(true);

        const completeTimer =
          setTimeout(() => {
            onComplete();
          }, FADE_TIME);

        return () =>
          clearTimeout(
            completeTimer
          );
      }, remaining);

    return () =>
      clearTimeout(
        finishTimer
      );
  }, [
    started,
    isAppReady,
    onComplete,
  ]);

  /*
   * Helper for CSS animations.
   */
  const anim = (
    animation: string
  ) => {
    if (!started) {
      return {
        animation: 'none',
      };
    }

    return {
      animation,
    };
  };

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950 max-w-[480px] mx-auto transition-opacity duration-500 ${
        fading
          ? 'opacity-0'
          : 'opacity-100'
      }`}
    >

      {/* =========================
          AMBIENT GLOW
          ========================= */}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/[0.06] rounded-full blur-3xl" />

      {/* =========================
          OUTER RING
          ========================= */}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="w-24 h-24 border-2 border-emerald-500/20 rounded-full"
          style={anim(
            'splashRing 2.8s ease-out forwards'
          )}
        />
      </div>

      {/* =========================
          SECOND RING
          ========================= */}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="w-24 h-24 border-2 border-emerald-500/15 rounded-full"
          style={anim(
            'splashRing 2.8s ease-out 0.4s forwards'
          )}
        />
      </div>

      {/* =========================
          LOGO
          ========================= */}

      <div
        className="relative"
        style={anim(
          'splashLogoIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        )}
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
        className="mt-6 text-center"
        style={anim(
          'contentSlideUp 0.8s ease-out 0.7s both'
        )}
      >
        <h1
          className="text-2xl font-black tracking-tight text-transparent bg-clip-text"
          style={{
            backgroundImage:
              'linear-gradient(90deg, #22c55e, #86efac, #22c55e)',
            backgroundSize:
              '200% auto',

            ...(started
              ? {
                  animation:
                    'splashShimmer 2s linear infinite',
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
        className="absolute bottom-20 w-32 h-0.5 bg-white/5 rounded-full overflow-hidden"
        style={anim(
          'contentSlideUp 0.6s ease-out 1.1s both'
        )}
      >
        <div
          className="h-full bg-emerald-500 rounded-full"
          style={anim(
            'splashBar 3s ease-in-out 1.1s forwards'
          )}
        />
      </div>

    </div>
  );
}
```
