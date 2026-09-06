import { useEffect, useState } from 'react';

interface FleetProgressRingProps {
  pct: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  glow?: boolean;
  animated?: boolean;
  showTicks?: boolean;
  showPulse?: boolean;
}

export function FleetProgressRing({ 
  pct, 
  size = 120, 
  strokeWidth = 6, 
  label, 
  sublabel,
  color = '#22c55e',
  glow = true,
  animated = true,
  showTicks = true,
  showPulse = true,
}: FleetProgressRingProps) {
  const [displayPct, setDisplayPct] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [orbitAngle, setOrbitAngle] = useState(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, pct));
  const offset = circumference - (clamped / 100) * circumference;
  
  // Animação suave da porcentagem
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 800;
    const from = displayPct;
    const to = clamped;
    
    const update = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      
      setDisplayPct(current);
      
      if (progress < 1) {
        raf = requestAnimationFrame(update);
      }
    };
    
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  // Animação orbital usando JavaScript (funciona em mobile)
  useEffect(() => {
    if (!animated || displayPct === 0) return;
    
    let raf: number;
    let lastTime = performance.now();
    
    const rotate = (now: number) => {
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      
      setOrbitAngle(prev => (prev + deltaTime * 60) % 360); // 60 graus por segundo
      raf = requestAnimationFrame(rotate);
    };
    
    raf = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(raf);
  }, [animated, displayPct]);

  // Efeito de pulso quando completa
  useEffect(() => {
    if (clamped >= 100 && showPulse) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [clamped, showPulse]);

  // Converter hex para rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Ticks ao redor do anel
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 360) / 24;
    const isActive = (i / 24) * 100 <= clamped;
    return { angle, isActive };
  });

  // Posição das partículas orbitais calculada por JavaScript
  const orbitalParticles = [
    { size: 3, distance: size * 0.45, speed: 1, color: color },
    { size: 2, distance: size * 0.5, speed: 0.8, color: hexToRgba(color, 0.7) },
    { size: 4, distance: size * 0.42, speed: 1.2, color: '#ffffff' },
  ].map((particle, index) => {
    const angle = (orbitAngle * particle.speed + index * 120) * (Math.PI / 180);
    const x = Math.cos(angle) * particle.distance;
    const y = Math.sin(angle) * particle.distance;
    
    return {
      ...particle,
      x: size / 2 + x - particle.size / 2,
      y: size / 2 + y - particle.size / 2,
    };
  });

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ 
        width: size, 
        height: size,
        transform: isPulsing ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s ease-out',
        WebkitTransition: 'transform 0.3s ease-out',
      }}
    >
      {/* Glow de fundo */}
      {glow && (
        <div
          className="absolute rounded-full"
          style={{
            width: size * 1.1,
            height: size * 1.1,
            background: `radial-gradient(circle, ${hexToRgba(color, 0.15)} 0%, transparent 70%)`,
            opacity: displayPct > 0 ? 1 : 0,
            transition: 'opacity 0.5s ease-out',
            WebkitTransition: 'opacity 0.5s ease-out',
            animation: isPulsing ? 'ringPulse 0.6s ease-out' : 'none',
            WebkitAnimation: isPulsing ? 'ringPulse 0.6s ease-out' : 'none',
          }}
        />
      )}
      
      {/* Partículas orbitais - Agora usam left/top com transições */}
      {animated && displayPct > 0 && orbitalParticles.map((particle, index) => (
        <div
          key={index}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: particle.x,
            top: particle.y,
            background: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${hexToRgba(color, 0.6)}`,
            transition: 'left 0.05s linear, top 0.05s linear',
            WebkitTransition: 'left 0.05s linear, top 0.05s linear',
            opacity: displayPct > 0 && displayPct < 100 ? 1 : 0,
          }}
        />
      ))}
      
      {/* SVG do anel */}
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="50%" stopColor={hexToRgba(color, 0.7)} />
            <stop offset="100%" stopColor={hexToRgba(color, 0.4)} />
          </linearGradient>
          
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Track com textura */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={strokeWidth}
          strokeDasharray="2 4"
        />
        
        {/* Track principal */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progresso principal */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={glow ? 'url(#glowFilter)' : 'none'}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            WebkitTransition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
        
        {/* Brilho na ponta do progresso */}
        {displayPct > 0 && displayPct < 100 && (
          <circle
            cx={size / 2 + radius * Math.cos(-Math.PI / 2 + (displayPct / 100) * 2 * Math.PI)}
            cy={size / 2 + radius * Math.sin(-Math.PI / 2 + (displayPct / 100) * 2 * Math.PI)}
            r={strokeWidth * 0.7}
            fill="#ffffff"
            style={{
              filter: `drop-shadow(0 0 ${strokeWidth}px ${color})`,
              transition: 'all 0.1s linear',
              WebkitTransition: 'all 0.1s linear',
            }}
          />
        )}
      </svg>
      
      {/* Ticks decorativos */}
      {showTicks && (
        <div className="absolute inset-0">
          {ticks.map((tick, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                width: 2,
                height: tick.isActive ? 4 : 2,
                background: tick.isActive ? color : 'rgba(255,255,255,0.1)',
                borderRadius: '1px',
                transform: `rotate(${tick.angle}deg) translateY(-${size / 2 - 2}px)`,
                transformOrigin: 'center center',
                opacity: tick.isActive ? 0.8 : 0.3,
                transition: 'all 0.3s ease',
                WebkitTransition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
      
      {/* Conteúdo central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span 
            className="text-2xl font-black text-white leading-none"
            style={{
              opacity: displayPct > 0 ? 1 : 0,
              transform: displayPct > 0 ? 'scale(1)' : 'scale(0.5)',
              transition: 'all 0.5s ease-out',
              WebkitTransition: 'all 0.5s ease-out',
            }}
          >
            {label}
          </span>
        )}
        
        {sublabel && (
          <span 
            className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1"
            style={{
              opacity: displayPct > 0 ? 1 : 0,
              transition: 'opacity 0.5s ease-out 0.2s',
              WebkitTransition: 'opacity 0.5s ease-out 0.2s',
            }}
          >
            {sublabel}
          </span>
        )}
        
        {/* Mini porcentagem */}
        {displayPct > 0 && (
          <span 
            className="text-[8px] font-bold mt-1"
            style={{
              color: color,
              opacity: 0.7,
            }}
          >
            {Math.round(displayPct)}%
          </span>
        )}
      </div>
      
      <style>
        {`
          @keyframes ringPulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(1.2);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}
