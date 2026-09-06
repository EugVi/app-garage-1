import { useEffect, useState } from 'react';

interface ProgressBarProps {
  pct: number;
  color?: string;
  height?: number;
  glow?: boolean;
  className?: string;
  animated?: boolean;
  showPercentage?: boolean;
  showParticles?: boolean;
  striped?: boolean;
  gradient?: boolean;
}

export function ProgressBar({ 
  pct, 
  color = '#22c55e', 
  height = 6, 
  glow = false, 
  className = '',
  animated = true,
  showPercentage = false,
  showParticles = true,
  striped = true,
  gradient = true,
}: ProgressBarProps) {
  const [displayPct, setDisplayPct] = useState(0);
  const [isIncreasing, setIsIncreasing] = useState(true);
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number }>>([]);
  
  const clamped = Math.min(100, Math.max(0, pct));

  // Animação suave do número
  useEffect(() => {
    setIsIncreasing(displayPct < clamped);
    const timer = setTimeout(() => {
      setDisplayPct(clamped);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [clamped, displayPct]);

  // Gerar partículas quando a barra está aumentando
  useEffect(() => {
    if (showParticles && isIncreasing && displayPct > 0 && displayPct < 100) {
      const newParticle = {
        id: Date.now(),
        left: displayPct,
        delay: Math.random() * 0.5,
      };
      
      setParticles(prev => [...prev.slice(-5), newParticle]);
      
      const cleanupTimer = setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 2000);
      
      return () => clearTimeout(cleanupTimer);
    }
  }, [displayPct, isIncreasing, showParticles]);

  // Cores derivadas
  const getGradient = () => {
    if (!gradient) return color;
    
    // Converte hex para rgba
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    return `linear-gradient(90deg, 
      ${hexToRgba(color, 0.3)} 0%, 
      ${color} 30%, 
      ${hexToRgba(color, 1)} 50%, 
      ${color} 70%, 
      ${hexToRgba(color, 0.3)} 100%)`;
  };

  // Efeito de listras animadas
  const stripesStyle = striped ? {
    backgroundImage: `repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.15) 0px,
      rgba(255, 255, 255, 0.15) 10px,
      transparent 10px,
      transparent 20px
    )`,
    backgroundSize: '200% 100%',
    animation: 'progressStripes 1s linear infinite',
  } : {};

  return (
    <div className={`relative ${className}`}>
      {/* Container principal */}
      <div
        className="relative w-full bg-white/5 rounded-full overflow-visible"
        style={{ height }}
      >
        {/* Barra de fundo com brilho sutil */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
          }}
        />
        
        {/* Barra de progresso principal */}
        <div
          className="relative h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${clamped}%`,
            background: getGradient(),
            boxShadow: glow ? `0 0 12px ${color}80, 0 0 24px ${color}40` : 'none',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Listras animadas */}
          {striped && (
            <div 
              className="absolute inset-0"
              style={stripesStyle}
            />
          )}
          
          {/* Brilho que percorre a barra */}
          {animated && (
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'progressShine 2s ease-in-out infinite',
              }}
            />
          )}
          
          {/* Ponta brilhante */}
          <div 
            className="absolute right-0 top-1/2 -translate-y-1/2"
            style={{
              width: height * 2,
              height: height * 2,
              background: 'white',
              borderRadius: '50%',
              boxShadow: `0 0 ${height * 2}px ${color}, 0 0 ${height * 3}px ${color}`,
              opacity: 0.8,
              animation: 'progressTipPulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
        
        {/* Partículas flutuantes */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute -top-2"
            style={{
              left: `${particle.left}%`,
              width: 4,
              height: 4,
              background: color,
              borderRadius: '50%',
              boxShadow: `0 0 6px ${color}`,
              animation: `progressParticle 1s ease-out ${particle.delay}s forwards`,
              opacity: 0,
            }}
          />
        ))}
        
        {/* Marcadores de progresso */}
        {[25, 50, 75].map(marker => (
          <div
            key={marker}
            className="absolute top-1/2 -translate-y-1/2"
            style={{
              left: `${marker}%`,
              width: 1,
              height: height * 0.6,
              background: 'rgba(255, 255, 255, 0.3)',
              opacity: clamped > marker ? 1 : 0.3,
              transition: 'opacity 0.3s ease',
            }}
          />
        ))}
      </div>
      
      {/* Porcentagem animada */}
      {showPercentage && (
        <div 
          className="absolute -top-6 text-xs font-bold transition-all duration-300"
          style={{
            left: `${clamped}%`,
            transform: 'translateX(-50%)',
            color: color,
            opacity: clamped > 0 ? 1 : 0,
          }}
        >
          <span style={{
            display: 'inline-block',
            animation: isIncreasing ? 'progressNumberUp 0.5s ease-out' : 'progressNumberDown 0.5s ease-out',
          }}>
            {displayPct}%
          </span>
        </div>
      )}
      
      {/* Tooltip na ponta */}
      {showPercentage && clamped > 0 && clamped < 100 && (
        <div 
          className="absolute -top-10 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs"
          style={{
            left: `${clamped}%`,
            transform: 'translateX(-50%)',
            animation: 'progressTooltipFade 0.3s ease-out',
          }}
        >
          <span style={{ color }}>
            {displayPct}%
          </span>
          <div 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: `4px solid ${color}`,
            }}
          />
        </div>
      )}
      
      <style>
        {`
          @keyframes progressShine {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(200%);
            }
          }
          
          @keyframes progressStripes {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: 40px 0;
            }
          }
          
          @keyframes progressParticle {
            0% {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translateY(-20px) scale(0);
              opacity: 0;
            }
          }
          
          @keyframes progressTipPulse {
            0%, 100% {
              transform: translateY(-50%) scale(1);
              opacity: 0.8;
            }
            50% {
              transform: translateY(-50%) scale(1.5);
              opacity: 1;
            }
          }
          
          @keyframes progressNumberUp {
            0% {
              transform: translateY(10px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes progressNumberDown {
            0% {
              transform: translateY(-10px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes progressTooltipFade {
            0% {
              opacity: 0;
              transform: translateX(-50%) scale(0.8);
            }
            100% {
              opacity: 1;
              transform: translateX(-50%) scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}
