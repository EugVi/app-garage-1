import { useEffect, useRef, useState } from 'react';

interface RollingNumberProps {
  value: number;
  duration?: number;
  className?: string;
  formatFn?: (n: number) => string;
  animated?: boolean;
  showDecimals?: boolean;
  glowEffect?: boolean;
  glowColor?: string;
  scaleEffect?: boolean;
  slideEffect?: boolean;
  showPlusSign?: boolean;
  showParticles?: boolean;
}

export function RollingNumber({ 
  value, 
  duration = 600, 
  className = '', 
  formatFn,
  animated = true,
  showDecimals = true,
  glowEffect = false,
  glowColor = 'rgba(34,197,94,0.5)',
  scaleEffect = true,
  slideEffect = true,
  showPlusSign = false,
  showParticles = false,
}: RollingNumberProps) {
  const [display, setDisplay] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'up' | 'down'>('up');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const prefersReduced = useRef(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    prefersReduced.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  // Gera partículas durante animação
  useEffect(() => {
    if (!showParticles || !isAnimating) return;
    
    const interval = setInterval(() => {
      const newParticle = {
        id: Date.now(),
        x: Math.random() * 100,
        y: -Math.random() * 20,
      };
      
      setParticles(prev => [...prev.slice(-5), newParticle]);
      
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 1000);
    }, 150);
    
    return () => clearInterval(interval);
  }, [isAnimating, showParticles]);

  useEffect(() => {
    if (!animated || prefersReduced.current) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    setAnimationDirection(to > from ? 'up' : 'down');
    setIsAnimating(true);

    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      
      // Easing elástico para números pequenos, suave para grandes
      const diff = Math.abs(to - from);
      const eased = diff < 10 
        ? 1 - Math.pow(1 - t, 3) 
        : 1 - Math.pow(1 - t, 4);
      
      const current = from + (to - from) * eased;
      
      setDisplay(current);
      
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = to;
        setDisplay(to);
        setIsAnimating(false);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { 
      if (rafRef.current) cancelAnimationFrame(rafRef.current); 
    };
  }, [value, duration, animated]);

  const getFormattedValue = () => {
    if (formatFn) return formatFn(display);
    
    if (showDecimals && isAnimating) {
      return display.toFixed(1);
    }
    
    return Math.round(display).toString();
  };

  const formatted = getFormattedValue();
  const isPositive = value > fromRef.current;
  const showPlus = showPlusSign && isPositive && isAnimating;

  return (
    <span 
      ref={containerRef}
      className={`relative inline-block ${className}`}
      style={{
        transform: scaleEffect && isAnimating ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        WebkitTransition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        textShadow: glowEffect && isAnimating 
          ? `0 0 10px ${glowColor}, 0 0 20px ${glowColor}40, 0 0 30px ${glowColor}20` 
          : 'none',
        WebkitTextShadow: glowEffect && isAnimating 
          ? `0 0 10px ${glowColor}, 0 0 20px ${glowColor}40, 0 0 30px ${glowColor}20` 
          : 'none',
      }}
    >
      {/* Sinal de + para valores positivos */}
      {showPlus && (
        <span
          className="absolute -left-3 top-0"
          style={{
            color: glowColor,
            animation: 'fadeInScale 0.3s ease-out',
            WebkitAnimation: 'fadeInScale 0.3s ease-out',
          }}
        >
          +
        </span>
      )}
      
      {/* Número principal */}
      <span
        style={{
          display: 'inline-block',
          animation: slideEffect && isAnimating 
            ? animationDirection === 'up' 
              ? 'rollUp 0.4s ease-out' 
              : 'rollDown 0.4s ease-out'
            : 'none',
          WebkitAnimation: slideEffect && isAnimating 
            ? animationDirection === 'up' 
              ? 'rollUp 0.4s ease-out' 
              : 'rollDown 0.4s ease-out'
            : 'none',
        }}
      >
        {formatted}
      </span>
      
      {/* Partículas flutuantes */}
      {particles.map(particle => (
        <span
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: particle.y,
            width: 3,
            height: 3,
            background: glowColor,
            borderRadius: '50%',
            animation: 'floatParticle 1s ease-out forwards',
            WebkitAnimation: 'floatParticle 1s ease-out forwards',
          }}
        />
      ))}
      
      <style>
        {`
          @keyframes rollUp {
            0% {
              transform: translateY(60%);
              opacity: 0;
            }
            60% {
              opacity: 1;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes rollDown {
            0% {
              transform: translateY(-60%);
              opacity: 0;
            }
            60% {
              opacity: 1;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes floatParticle {
            0% {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translateY(-30px) scale(0);
              opacity: 0;
            }
          }
          
          @keyframes fadeInScale {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </span>
  );
}
