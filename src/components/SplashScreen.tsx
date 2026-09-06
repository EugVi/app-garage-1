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
  const [showParticles, setShowParticles] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const MIN_SPLASH_TIME = 6000;
  const FADE_TIME = 800;

  // Inicialização
  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (startTimeRef.current === null) {
        startTimeRef.current = performance.now();
        setStarted(true);
        setAnimationStep(1);
        
        // Ativa partículas após 500ms
        setTimeout(() => setShowParticles(true), 500);
      }
    }, 300);

    return () => clearTimeout(initTimer);
  }, []);

  // Sequência de animações
  useEffect(() => {
    if (!started) return;

    const timers = [
      setTimeout(() => setAnimationStep(2), 400),  // Logo com zoom
      setTimeout(() => setAnimationStep(3), 1100), // Texto da marca
      setTimeout(() => setAnimationStep(4), 1800), // Loading indicator
      setTimeout(() => setAnimationStep(5), 2500), // Efeito de brilho
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [started]);

  // Sistema de progresso
  useEffect(() => {
    if (animationStep >= 4 && !progressIntervalRef.current) {
      let currentProgress = 0;
      const totalDuration = 3500;
      const intervalTime = 50;
      const incrementPerInterval = (100 * intervalTime) / totalDuration;

      progressIntervalRef.current = setInterval(() => {
        currentProgress += incrementPerInterval;
        if (currentProgress >= 100) {
          currentProgress = 100;
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
        setProgress(Math.min(Math.round(currentProgress), 100));
      }, intervalTime);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [animationStep]);

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

  // Estilos dinâmicos
  const getStyles = (step: number, options: any = {}) => {
    const isActive = animationStep >= step;
    const {
      translateY = 30,
      translateX = 0,
      scale = 0.8,
      rotate = 0,
      duration = 0.8,
      delay = 0,
      blur = 10,
    } = options;
    
    return {
      opacity: isActive ? 1 : 0,
      transform: isActive 
        ? 'translateY(0) translateX(0) scale(1) rotate(0deg)'
        : `translateY(${translateY}px) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
      filter: isActive ? 'blur(0px)' : `blur(${blur}px)`,
      transition: `all ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      WebkitTransition: `all ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      willChange: 'transform, opacity, filter',
    };
  };

  // Estilo dos anéis
  const getRingStyles = (index: number) => {
    const isActive = animationStep >= 1;
    const delays = [0, 0.3, 0.6];
    const durations = [2.5, 3, 3.5];
    const scales = [1.8, 2, 2.2];
    
    return {
      opacity: isActive ? 0 : 1,
      transform: isActive ? `scale(${scales[index]})` : 'scale(0.5)',
      transition: `all ${durations[index]}s cubic-bezier(0.4, 0, 0.2, 1) ${delays[index]}s`,
      WebkitTransition: `all ${durations[index]}s cubic-bezier(0.4, 0, 0.2, 1) ${delays[index]}s`,
    };
  };

  // Partículas decorativas
  const particles = [
    { top: '20%', left: '30%', delay: 0, size: 4 },
    { top: '30%', left: '70%', delay: 0.5, size: 6 },
    { top: '60%', left: '25%', delay: 1, size: 5 },
    { top: '70%', left: '75%', delay: 1.5, size: 3 },
    { top: '40%', left: '50%', delay: 2, size: 7 },
    { top: '50%', left: '20%', delay: 2.5, size: 4 },
    { top: '25%', left: '55%', delay: 3, size: 5 },
    { top: '65%', left: '60%', delay: 3.5, size: 6 },
  ];

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950 max-w-[480px] mx-auto transition-all ${
        fading ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
      }`}
      style={{
        transitionDuration: `${FADE_TIME}ms`,
        WebkitTransitionDuration: `${FADE_TIME}ms`,
        overflow: 'hidden',
      }}
    >
      {/* =========================
          BACKGROUND EFFECTS
          ========================= */}
      
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.1) 0%, transparent 70%)',
          opacity: started ? 1 : 0,
          transform: started ? 'scale(1)' : 'scale(0.5)',
          transition: 'all 2s ease-out',
          WebkitTransition: 'all 2s ease-out',
        }}
      />

      {/* Partículas flutuantes */}
      {showParticles && particles.map((particle, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-emerald-500/30"
          style={{
            top: particle.top,
            left: particle.left,
            width: particle.size,
            height: particle.size,
            animation: `floatParticle ${3 + index * 0.5}s ease-in-out ${particle.delay}s infinite`,
            WebkitAnimation: `floatParticle ${3 + index * 0.5}s ease-in-out ${particle.delay}s infinite`,
            boxShadow: '0 0 10px rgba(34,197,94,0.5)',
          }}
        />
      ))}

      {/* =========================
          RINGS COM PULSO
          ========================= */}
      
      {[0, 1, 2].map((index) => (
        <div 
          key={index}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div
            className="rounded-full"
            style={{
              width: `${80 + index * 20}px`,
              height: `${80 + index * 20}px`,
              border: `2px solid rgba(34,197,94,${0.3 - index * 0.08})`,
              ...getRingStyles(index),
            }}
          />
        </div>
      ))}

      {/* =========================
          LOGO COM EFEITO 3D
          ========================= */}
      
      <div 
        className="relative"
        style={getStyles(2, {
          scale: 0.3,
          translateY: 40,
          rotate: -15,
          duration: 1.2,
          blur: 20,
        })}
      >
        <div 
          className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-2xl"
          style={{
            transform: animationStep >= 2 ? 'scale(1.3)' : 'scale(0.5)',
            opacity: animationStep >= 2 ? 0.8 : 0,
            transition: 'all 1.5s ease-out 0.3s',
            WebkitTransition: 'all 1.5s ease-out 0.3s',
          }}
        />
        
        <div 
          className="relative w-20 h-20 rounded-2xl bg-gradient-to-b from-emerald-500/30 to-emerald-500/10 border border-emerald-500/40 flex items-center justify-center"
          style={{
            boxShadow: '0 0 40px rgba(34,197,94,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            transform: animationStep >= 5 ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.5s ease-out',
            WebkitTransition: 'transform 0.5s ease-out',
          }}
        >
          <Car
            size={40}
            className="text-emerald-400"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(34,197,94,0.8))',
            }}
          />
        </div>
      </div>

      {/* =========================
          BRAND COM EFEITO DE REVEAL
          ========================= */}
      
      <div 
        className="mt-8 text-center"
        style={getStyles(3, {
          scale: 0.7,
          translateY: 50,
          duration: 1,
          blur: 15,
        })}
      >
        <h1
          className="text-3xl font-black tracking-tight text-transparent bg-clip-text"
          style={{
            backgroundImage: 'linear-gradient(90deg, #22c55e, #86efac, #22c55e)',
            backgroundSize: '200% auto',
            animation: started ? 'shimmerText 3s linear infinite' : 'none',
            WebkitAnimation: started ? 'shimmerText 3s linear infinite' : 'none',
            letterSpacing: '0.1em',
          }}
        >
          FLEET GARAGE
        </h1>

        <p 
          className="text-[11px] text-zinc-500 font-bold tracking-[0.4em] mt-3"
          style={{
            opacity: animationStep >= 3 ? 1 : 0,
            transform: animationStep >= 3 ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.8s ease-out 0.5s',
            WebkitTransition: 'all 0.8s ease-out 0.5s',
          }}
        >
          BUILD YOUR FLEET
        </p>
      </div>

      {/* =========================
          LOADING INDICATOR (CIRCULAR)
          ========================= */}
      
      <div
        className="absolute bottom-24 flex flex-col items-center gap-4"
        style={getStyles(4, {
          scale: 0.5,
          translateY: 30,
          duration: 0.8,
          blur: 8,
        })}
      >
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${(progress / 100) * 138.23} 138.23`}
              style={{
                transition: 'stroke-dasharray 0.1s linear',
                WebkitTransition: 'stroke-dasharray 0.1s linear',
              }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#86efac" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-emerald-400">
              {progress}%
            </span>
          </div>
        </div>

        <div className="text-center">
          <span className="text-[9px] text-emerald-500/60 font-semibold tracking-[0.3em]">
            INICIALIZANDO
          </span>
        </div>
      </div>

      {/* =========================
          ASSINATURA NERD & MONEY
          ========================= */}
      
      <div
        className="absolute bottom-6 text-center px-6"
        style={{
          opacity: animationStep >= 4 ? 1 : 0,
          transform: animationStep >= 4 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s ease-out 0.8s',
          WebkitTransition: 'all 1s ease-out 0.8s',
        }}
      >
        <div className="flex items-center gap-3 justify-center">
          <span className="w-8 h-px bg-gradient-to-r from-transparent to-emerald-500/50" />
          
          <div className="flex items-center gap-1.5">
            {/* Ícone de código/terminal */}
            <span className="text-emerald-500/70 text-[10px] font-mono">
              {'</>'}
            </span>
            <span className="text-[8px] text-zinc-600 font-medium tracking-[0.2em] uppercase">
              developed by
            </span>
            {/* Ícone de dinheiro */}
            <span className="text-emerald-500/70 text-[10px]">
              $
            </span>
          </div>
          
          <span className="w-8 h-px bg-gradient-to-l from-transparent to-emerald-500/50" />
        </div>
        
        <p 
          className="text-[11px] mt-2 font-bold tracking-[0.15em] text-transparent bg-clip-text"
          style={{
            backgroundImage: 'linear-gradient(90deg, #22c55e, #86efac, #22c55e)',
            backgroundSize: '200% auto',
            animation: started ? 'shimmerText 3s linear infinite' : 'none',
            WebkitAnimation: started ? 'shimmerText 3s linear infinite' : 'none',
          }}
        >
          EUGÉNIO'S CREATIONS
        </p>
        
        {/* Tagline nerd/money */}
        <p className="text-[7px] text-zinc-700 font-mono mt-1 tracking-wider">
          {'// code smart. build wealth.'}
        </p>
      </div>

      {/* =========================
          KEYFRAMES
          ========================= */}
      
      <style>
        {`
          @keyframes shimmerText {
            0% {
              background-position: 0% center;
            }
            100% {
              background-position: -200% center;
            }
          }

          @keyframes floatParticle {
            0%, 100% {
              transform: translateY(0) translateX(0);
              opacity: 0.3;
            }
            25% {
              transform: translateY(-30px) translateX(15px);
              opacity: 0.8;
            }
            50% {
              transform: translateY(-60px) translateX(-15px);
              opacity: 1;
            }
            75% {
              transform: translateY(-30px) translateX(10px);
              opacity: 0.6;
            }
          }
        `}
      </style>
    </div>
  );
}
