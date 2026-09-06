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
  const [particles, setParticles] = useState<Array<{ id: number; left: number; top: number }>>([]);
  
  const clamped = Math.min(100, Math.max(0, pct));

  // Animação suave do número usando requestAnimationFrame
  useEffect(() => {
    let animationFrame: number;
    const startValue = displayPct;
    const endValue = clamped;
    const startTime = performance.now();
    const duration = 700; // 700ms

    setIsIncreasing(endValue > startValue);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * eased;
      
      setDisplayPct(Math.round(currentValue));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [clamped]);

  // Gerar partículas (versão mobile-friendly)
  useEffect(() => {
    if (showParticles && isIncreasing && displayPct > 0 && displayPct < 100) {
      // Criar 2 partículas por atualização significativa
      const newParticles = [
        {
          id: Date.now(),
          left: displayPct + Math.random() * 3,
          top: -Math.random() * 5,
        },
        {
          id: Date.now() + 1,
          left: displayPct - Math.random() * 3,
          top: -Math.random() * 5,
        },
      ];
      
      setParticles(prev => [...prev.slice(-8), ...newParticles]);
      
      // Limpar partículas antigas
      const cleanupTimer = setTimeout(() => {
        setParticles(prev => prev.filter(p => 
          !newParticles.find(np => np.id === p.id)
        ));
      }, 1500);
      
      return () => clearTimeout(cleanupTimer);
    }
  }, [displayPct, isIncreasing, showParticles]);

  // Converter hex para rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Estilos com transições (funcionam melhor em mobile)
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: height,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '9999px',
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
  };

  const barStyle: React.CSSProperties = {
    height: '100%',
    width: `${clamped}%`,
    background: gradient 
      ? `linear-gradient(90deg, ${hexToRgba(color, 0.5)}, ${color}, ${hexToRgba(color, 0.8)})`
      : color,
    borderRadius: '9999px',
    transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
    WebkitTransition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: glow ? `0 0 10px ${hexToRgba(color, 0.6)}, 0 0 20px ${hexToRgba(color, 0.3)}` : 'none',
    position: 'relative',
  };

  // Overlay de brilho (apenas visual, sem animação complexa)
  const shineStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
    borderRadius: '9999px',
  };

  // Listras com transição simples
  const stripesStyle: React.CSSProperties = striped ? {
    backgroundImage: `repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.1) 0px,
      rgba(255, 255, 255, 0.1) 8px,
      transparent 8px,
      transparent 16px
    )`,
    opacity: 0.5,
  } : {};

  // Ponta brilhante
  const tipStyle: React.CSSProperties = {
    position: 'absolute',
    right: -height,
    top: '50%',
    transform: 'translateY(-50%)',
    width: height * 2,
    height: height * 2,
    background: '#ffffff',
    borderRadius: '50%',
    boxShadow: `0 0 ${height * 2}px ${color}`,
    opacity: 0.6,
  };

  return (
    <div className={`relative ${className}`}>
      {/* Container principal */}
      <div style={containerStyle}>
        {/* Barra de progresso */}
        <div style={barStyle}>
          {/* Listras */}
          {striped && (
            <div 
              style={{
                ...shineStyle,
                ...stripesStyle,
              }}
            />
          )}
          
          {/* Brilho superior */}
          {!striped && (
            <div style={shineStyle} />
          )}
        </div>
        
        {/* Ponta brilhante */}
        {clamped > 0 && clamped < 100 && (
          <div style={tipStyle} />
        )}
        
        {/* Marcadores de progresso */}
        {[25, 50, 75].map(marker => (
          <div
            key={marker}
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              left: `${marker}%`,
              width: 1,
              height: height * 0.5,
              background: 'rgba(255, 255, 255, 0.3)',
              opacity: clamped > marker ? 1 : 0.2,
              transition: 'opacity 0.3s ease',
              WebkitTransition: 'opacity 0.3s ease',
            }}
          />
        ))}
      </div>
      
      {/* Partículas (versão simplificada para mobile) */}
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.left}%`,
            top: particle.top,
            width: 3,
            height: 3,
            background: color,
            borderRadius: '50%',
            boxShadow: `0 0 4px ${color}`,
            opacity: 0,
            animation: `particleFloat 1s ease-out forwards`,
            WebkitAnimation: `particleFloat 1s ease-out forwards`,
          }}
        />
      ))}
      
      {/* Porcentagem */}
      {showPercentage && displayPct > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -height * 3,
            left: `${clamped}%`,
            transform: 'translateX(-50%)',
            transition: 'all 0.5s ease-out',
            WebkitTransition: 'all 0.5s ease-out',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: color,
              textShadow: glow ? `0 0 8px ${color}` : 'none',
            }}
          >
            {displayPct}%
          </span>
        </div>
      )}
      
      <style>
        {`
          @keyframes particleFloat {
            0% {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translateY(-15px) scale(0);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}
