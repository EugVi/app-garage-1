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
  const [started, setStarted] = useState(false);
  const [fading, setFading] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const MIN_SPLASH_TIME = 5500;
  const FADE_TIME = 800;

  // Inicialização
  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (startTimeRef.current === null) {
        startTimeRef.current = performance.now();
        setStarted(true);
        setAnimationStep(1); // Inicia a primeira animação
      }
    }, 300);

    return () => clearTimeout(initTimer);
  }, []);

  // Sequência de animações usando timeouts
  useEffect(() => {
    if (!started) return;

    const timers = [
      // Step 2: Logo aparece após 200ms
      setTimeout(() => setAnimationStep(2), 200),
      
      // Step 3: Brand text aparece após 900ms
      setTimeout(() => setAnimationStep(3), 900),
      
      // Step 4: Loading bar aparece após 1500ms
      setTimeout(() => setAnimationStep(4), 1500),
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [started]);

  // Finalização
  useEffect(() => {
    if (!started || !isAppReady || completedRef.current) return;

    const startedAt = startTimeRef.current ?? performance.now();
    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(0, MIN_SPLASH_TIME - elapsed);

    const finishTimer = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      setFading(true);

      const completeTimer = setTimeout(() => {
        onComplete();
      }, FADE_TIME);

      return () => clearTimeout(completeTimer);
    }, remaining);

    return () => clearTimeout(finishTimer);
  }, [started, isAppReady, onComplete]);

  // Estilos dinâmicos baseados no passo da animação
  const getStyles = (step: number, customStyles: any = {}) => {
    const isActive = animationStep >= step;
    
    return {
      opacity: isActive ? 1 : 0,
      transform: isActive ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.5)',
      transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      WebkitTransition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      ...customStyles,
    };
  };

  // Estilo para os anéis
  const getRingStyles = () => {
    const isActive = animationStep >= 1;
    
    return {
      opacity: isActive ? 0 : 1,
      transform: isActive ? 'scale(1.5)' : 'scale(0.8)',
      transition: 'all 3.5s ease-out',
      WebkitTransition: 'all 3.5s ease-out',
    };
  };

  // Estilo para a barra de loading
  const getBarStyles = () => {
    const isActive = animationStep >= 4;
    
    return {
      width: isActive ? '100%' : '0%',
      transition: 'width 4s ease-in-out',
      WebkitTransition: 'width 4s ease-in-out',
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
      {/* =========================
          AMBIENT GLOW
          ========================= */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/[0.06] rounded-full blur-3xl"
        style={{
          opacity: started ? 1 : 0,
          transition: 'opacity 1s ease-in',
          WebkitTransition: 'opacity 1s ease-in',
        }}
      />

      {/* =========================
          OUTER RING
          ========================= */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="w-24 h-24 border-2 border-emerald-500/20 rounded-full"
          style={getRingStyles()}
        />
      </div>

      {/* =========================
          SECOND RING
          ========================= */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="w-24 h-24 border-2 border-emerald-500/15 rounded-full"
          style={{
            ...getRingStyles(),
            transitionDelay: '0.5s',
            WebkitTransitionDelay: '0.5s',
          }}
        />
      </div>

      {/* =========================
          LOGO
          ========================= */}
      <div className="relative" style={getStyles(2)}>
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
      <div className="mt-6 text-center" style={getStyles(3)}>
        <h1
          className="text-2xl font-black tracking-tight text-transparent bg-clip-text"
          style={{
            backgroundImage: 'linear-gradient(90deg, #22c55e, #86efac, #22c55e)',
            backgroundSize: '200% auto',
            animation: started ? 'splashShimmer 2.5s linear infinite' : 'none',
            WebkitAnimation: started ? 'splashShimmer 2.5s linear infinite' : 'none',
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
        style={{
          opacity: animationStep >= 4 ? 1 : 0,
          transform: animationStep >= 4 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out',
          WebkitTransition: 'all 0.6s ease-out',
        }}
      >
        <div
          className="h-full bg-emerald-500 rounded-full"
          style={getBarStyles()}
        />
      </div>

      {/* Keyframes necessários */}
      <style>
        {`
          @keyframes splashShimmer {
            0% {
              background-position: 0% center;
            }
            100% {
              background-position: -200% center;
            }
          }
        `}
      </style>
    </div>
  );
}
