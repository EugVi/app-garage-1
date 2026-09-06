import { useEffect, useRef, useState } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: boolean;
  glowColor?: string;
  hoverable?: boolean;
  pressable?: boolean;
  showShine?: boolean;
  showBorder?: boolean;
  animated?: boolean;
  intensity?: 'subtle' | 'medium' | 'strong';
}

export function GlassCard({ 
  children, 
  className = '', 
  onClick, 
  glow = false, 
  glowColor = 'rgba(34,197,94,0.1)',
  hoverable = true,
  pressable = true,
  showShine = true,
  showBorder = true,
  animated = true,
  intensity = 'medium',
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [shinePosition, setShinePosition] = useState({ x: 50, y: 50 });

  // Intensidade dos efeitos
  const intensityMap = {
    subtle: {
      blur: '12px',
      borderOpacity: 0.04,
      bgOpacity: 0.02,
      glowStrength: 20,
      shineOpacity: 0.03,
      scaleHover: 1.01,
      scalePress: 0.98,
    },
    medium: {
      blur: '16px',
      borderOpacity: 0.06,
      bgOpacity: 0.03,
      glowStrength: 30,
      shineOpacity: 0.05,
      scaleHover: 1.02,
      scalePress: 0.97,
    },
    strong: {
      blur: '20px',
      borderOpacity: 0.08,
      bgOpacity: 0.04,
      glowStrength: 40,
      shineOpacity: 0.08,
      scaleHover: 1.03,
      scalePress: 0.96,
    },
  };

  const config = intensityMap[intensity];

  // Efeito de shine que segue o mouse
  useEffect(() => {
    if (!animated || !showShine) return;

    let raf: number;
    let targetX = 50;
    let targetY = 50;
    let currentX = 50;
    let currentY = 50;

    const animateShine = () => {
      // Suaviza o movimento
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      
      setShinePosition({ x: currentX, y: currentY });
      raf = requestAnimationFrame(animateShine);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width) * 100;
      targetY = ((e.clientY - rect.top) / rect.height) * 100;
    };

    if (hoverable) {
      window.addEventListener('mousemove', handleMouseMove);
      raf = requestAnimationFrame(animateShine);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [animated, showShine, hoverable]);

  // Efeito de tilt 3D (apenas desktop)
  useEffect(() => {
    if (!animated || !hoverable || !cardRef.current) return;

    const card = cardRef.current;
    let raf: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 768) return; // Desativa em mobile
      
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${config.scaleHover})`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [animated, hoverable, config.scaleHover]);

  // Efeito de brilho pulsante
  const getGlowStyle = () => {
    if (!glow) return {};
    
    return {
      boxShadow: isHovered 
        ? `0 0 ${config.glowStrength * 2}px ${glowColor}, 0 0 ${config.glowStrength}px ${glowColor}40`
        : `0 0 ${config.glowStrength}px ${glowColor}`,
      transition: 'box-shadow 0.3s ease',
      WebkitTransition: 'box-shadow 0.3s ease',
    };
  };

  // Efeito de borda dinâmica
  const getBorderStyle = () => {
    if (!showBorder) return {};
    
    return {
      borderColor: isHovered 
        ? `rgba(255,255,255,${config.borderOpacity * 2})` 
        : `rgba(255,255,255,${config.borderOpacity})`,
      transition: 'border-color 0.3s ease',
      WebkitTransition: 'border-color 0.3s ease',
    };
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        relative overflow-hidden
        rounded-2xl
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        background: `rgba(255,255,255,${config.bgOpacity})`,
        backdropFilter: `blur(${config.blur})`,
        WebkitBackdropFilter: `blur(${config.blur})`,
        border: `1px solid rgba(255,255,255,${config.borderOpacity})`,
        transform: isPressed 
          ? `scale(${config.scalePress})` 
          : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        WebkitTransition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform',
        ...getGlowStyle(),
        ...getBorderStyle(),
      }}
    >
      {/* Shine effect */}
      {showShine && animated && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${shinePosition.x}% ${shinePosition.y}%, rgba(255,255,255,${config.shineOpacity}) 0%, transparent 70%)`,
            transition: 'opacity 0.3s ease',
            WebkitTransition: 'opacity 0.3s ease',
            opacity: isHovered ? 1 : 0,
          }}
        />
      )}

      {/* Border shine animation */}
      {showBorder && animated && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(90deg, 
              transparent 0%, 
              ${glowColor}20 25%, 
              ${glowColor}40 50%, 
              ${glowColor}20 75%, 
              transparent 100%)`,
            backgroundSize: '200% 100%',
            animation: 'borderShine 3s linear infinite',
            WebkitAnimation: 'borderShine 3s linear infinite',
            opacity: isHovered ? 0.8 : 0.3,
            maskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
          }}
        />
      )}

      {/* Top highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          opacity: isHovered ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
          WebkitTransition: 'opacity 0.3s ease',
        }}
      />

      {/* Bottom subtle border */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      <style>
        {`
          @keyframes borderShine {
            0% {
              background-position: 0% 0%;
            }
            100% {
              background-position: -200% 0%;
            }
          }
        `}
      </style>
    </div>
  );
}
