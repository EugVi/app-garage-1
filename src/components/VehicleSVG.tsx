import { useEffect, useState } from 'react';
import type { VehicleStage } from '../types';

interface VehicleSVGProps {
  stage: VehicleStage;
  progress: number; // 0-100
  size?: number;
}

export function VehicleSVG({ stage, progress, size = 200 }: VehicleSVGProps) {
  const isAcquired = stage === 'ACQUIRED';
  const isBlueprint = stage === 'BLUEPRINT';
  const isAssembly = stage === 'ASSEMBLY';
  const isFinal = stage === 'FINAL_ASSEMBLY';

  const [scanLineY, setScanLineY] = useState(30);
  const [engineGlow, setEngineGlow] = useState(0.05);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [exhaustParticles, setExhaustParticles] = useState<Array<{ id: number; x: number; y: number; opacity: number }>>([]);
  const [headlightIntensity, setHeadlightIntensity] = useState(0.7);

  // Scan line animation
  useEffect(() => {
    if (!isBlueprint) return;
    let raf: number;
    let direction = 1;
    
    const animate = () => {
      setScanLineY(prev => {
        let newY = prev + direction * 0.5;
        if (newY >= 110) { newY = 110; direction = -1; }
        else if (newY <= 30) { newY = 30; direction = 1; }
        return newY;
      });
      raf = requestAnimationFrame(animate);
    };
    
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isBlueprint]);

  // Engine glow animation
  useEffect(() => {
    if (!isAcquired) return;
    let raf: number;
    let increasing = true;
    
    const animate = () => {
      setEngineGlow(prev => {
        let newGlow = prev + (increasing ? 0.001 : -0.001);
        if (newGlow >= 0.15) { newGlow = 0.15; increasing = false; }
        else if (newGlow <= 0.03) { newGlow = 0.03; increasing = true; }
        return newGlow;
      });
      raf = requestAnimationFrame(animate);
    };
    
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isAcquired]);

  // Wheel rotation
  useEffect(() => {
    if (!isAcquired) return;
    let raf: number;
    let lastTime = performance.now();
    
    const rotate = (now: number) => {
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      setWheelRotation(prev => (prev + deltaTime * 45) % 360);
      raf = requestAnimationFrame(rotate);
    };
    
    raf = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(raf);
  }, [isAcquired]);

  // Exhaust particles
  useEffect(() => {
    if (!isAcquired) return;
    
    const interval = setInterval(() => {
      const newParticle = {
        id: Date.now(),
        x: 30 + Math.random() * 10,
        y: 85 + Math.random() * 10,
        opacity: 0.6,
      };
      
      setExhaustParticles(prev => [...prev.slice(-5), newParticle]);
      
      setTimeout(() => {
        setExhaustParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 1500);
    }, 300);
    
    return () => clearInterval(interval);
  }, [isAcquired]);

  // Headlight intensity
  useEffect(() => {
    if (!isAcquired) return;
    let raf: number;
    let increasing = true;
    
    const animate = () => {
      setHeadlightIntensity(prev => {
        let newIntensity = prev + (increasing ? 0.005 : -0.005);
        if (newIntensity >= 0.95) { newIntensity = 0.95; increasing = false; }
        else if (newIntensity <= 0.5) { newIntensity = 0.5; increasing = true; }
        return newIntensity;
      });
      raf = requestAnimationFrame(animate);
    };
    
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isAcquired]);

  const blueprintOpacity = isBlueprint ? 0.3 + (progress / 30) * 0.2 : 0;
  const bodyOpacity = isAssembly ? 0.4 + ((progress - 30) / 40) * 0.3 : isFinal || isAcquired ? 0.9 : 0;
  const detailOpacity = isFinal ? 0.6 + ((progress - 70) / 30) * 0.4 : isAcquired ? 1 : 0;
  const headlightOn = isAcquired;

  const getSpokePosition = (cx: number, cy: number, angle: number, length: number) => {
    const radian = ((angle + wheelRotation) * Math.PI) / 180;
    return {
      x: cx + Math.cos(radian) * length,
      y: cy + Math.sin(radian) * length,
    };
  };

  return (
    <svg
      width={size}
      height={size * 0.62}
      viewBox="0 0 200 124"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="30%" stopColor="#2a2a2a" />
          <stop offset="70%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id="racingStripe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
          <stop offset="15%" stopColor="#22c55e" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#22c55e" stopOpacity="0.3" />
          <stop offset="85%" stopColor="#22c55e" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="headlightGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="1" />
          <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="underglow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Underglow effect */}
      {isAcquired && (
        <ellipse 
          cx="100" 
          cy="105" 
          rx="75" 
          ry="12" 
          fill="url(#underglow)"
          opacity={engineGlow}
          style={{
            transition: 'opacity 0.1s linear',
            WebkitTransition: 'opacity 0.1s linear',
          }}
        />
      )}

      {/* Exhaust particles */}
      {exhaustParticles.map(particle => (
        <circle
          key={particle.id}
          cx={particle.x}
          cy={particle.y}
          r="2"
          fill="#22c55e"
          opacity={particle.opacity}
          style={{
            transition: 'all 1.5s ease-out',
            WebkitTransition: 'all 1.5s ease-out',
            transform: `translate(${-particle.id % 5}px, ${-particle.id % 3}px)`,
          }}
        />
      ))}

      {/* Blueprint layer */}
      {isBlueprint && (
        <g opacity={blueprintOpacity}>
          <rect x="20" y="20" width="160" height="84" fill="none" stroke="#22c55e" strokeWidth="0.5" opacity="0.3" />
          
          {/* Muscle car blueprint */}
          <path
            d="M 25 95 L 25 80 Q 25 70 35 65 L 55 55 Q 65 35 100 35 L 135 35 Q 165 35 175 55 L 185 65 Q 190 70 190 80 L 190 95"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1"
            strokeDasharray="3 2"
            opacity="0.6"
          />
          
          <circle cx="60" cy="95" r="16" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="2 1" opacity="0.5" />
          <circle cx="160" cy="95" r="16" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="2 1" opacity="0.5" />
          
          <line 
            x1="20" 
            y1={scanLineY} 
            x2="180" 
            y2={scanLineY} 
            stroke="#22c55e" 
            strokeWidth="0.5" 
            opacity="0.4"
            style={{
              transition: 'all 0.05s linear',
              WebkitTransition: 'all 0.05s linear',
            }}
          />
          
          <text x="25" y="28" fill="#22c55e" fontSize="3" opacity="0.4" fontFamily="monospace">MUSCLE-01</text>
          <text x="140" y="28" fill="#22c55e" fontSize="3" opacity="0.4" fontFamily="monospace">SCAN...</text>
        </g>
      )}

      {/* Main car body */}
      {!isBlueprint && (
        <g opacity={bodyOpacity}>
          {/* Shadow */}
          <ellipse cx="100" cy="112" rx="75" ry="6" fill="#000" opacity="0.5" />
          
          {/* Main body - aggressive muscle car shape */}
          <path
            d="M 25 95 L 25 78 Q 25 68 35 63 L 55 53 Q 65 35 100 35 L 135 35 Q 165 35 175 53 L 188 63 Q 192 68 192 78 L 192 95 Z"
            fill="url(#bodyGrad)"
            stroke={isAcquired ? '#22c55e' : '#444'}
            strokeWidth="1"
          />
          
          {/* Racing stripe */}
          <path
            d="M 30 50 L 185 50"
            stroke="url(#racingStripe)"
            strokeWidth="4"
            opacity={isAcquired ? 1 : 0.3}
          />
          
          {/* Hood scoop */}
          <path
            d="M 75 42 Q 100 38 125 42 L 125 46 Q 100 43 75 46 Z"
            fill="#1a1a1a"
            stroke="#333"
            strokeWidth="0.5"
          />
          
          {/* Aggressive front splitter */}
          <path
            d="M 185 95 L 192 95 L 192 90 L 188 90 Z"
            fill="#1a1a1a"
            stroke={isAcquired ? '#22c55e' : '#444'}
            strokeWidth="0.5"
          />
          
          {/* Rear spoiler */}
          <path
            d="M 25 70 L 30 70 L 30 65 L 28 63 L 28 65 Z"
            fill="#1a1a1a"
            stroke="#333"
            strokeWidth="0.5"
          />
          
          {/* Windows - aggressive shape */}
          <g opacity={detailOpacity * 0.8}>
            <path d="M 68 55 Q 80 48 95 48 L 110 48 L 110 58 L 66 58 Z" fill="#1e3a5f" opacity="0.7" stroke="#3b5998" strokeWidth="0.5" />
            <path d="M 112 48 L 125 48 Q 145 48 155 55 L 155 58 L 112 58 Z" fill="#1e3a5f" opacity="0.7" stroke="#3b5998" strokeWidth="0.5" />
          </g>
          
          {/* Side exhaust */}
          <rect x="185" y="80" width="8" height="3" rx="1" fill="#333" stroke={isAcquired ? '#22c55e' : '#444'} strokeWidth="0.5" />
          
          {/* Door line */}
          <line x1="100" y1="60" x2="100" y2="93" stroke="#222" strokeWidth="0.8" opacity={detailOpacity} />
          
          {/* Door handle */}
          <rect x="103" y="75" width="3" height="1" rx="0.5" fill="#444" opacity={detailOpacity * 0.5} />
        </g>
      )}

      {/* Wheels - wide and aggressive */}
      {!isBlueprint && !isAssembly && (
        <g opacity={detailOpacity}>
          {/* Rear wheel - wide tire */}
          <circle cx="55" cy="95" r="16" fill="#0a0a0a" stroke="#333" strokeWidth="1.5" />
          <circle cx="55" cy="95" r="11" fill="#1a1a1a" stroke="#444" strokeWidth="0.5" />
          
          {/* Sport rims - 6 spokes */}
          {[0, 60, 120, 180, 240, 300].map(angle => {
            const end = getSpokePosition(55, 95, angle, 10);
            return (
              <line
                key={`rw-${angle}`}
                x1="55" 
                y1="95"
                x2={end.x}
                y2={end.y}
                stroke="#22c55e"
                strokeWidth="1.5"
                opacity="0.7"
                style={{
                  transition: 'all 0.05s linear',
                  WebkitTransition: 'all 0.05s linear',
                }}
              />
            );
          })}
          <circle cx="55" cy="95" r="3" fill="#22c55e" opacity="0.8" />
          
          {/* Front wheel - wide tire */}
          <circle cx="155" cy="95" r="16" fill="#0a0a0a" stroke="#333" strokeWidth="1.5" />
          <circle cx="155" cy="95" r="11" fill="#1a1a1a" stroke="#444" strokeWidth="0.5" />
          
          {[0, 60, 120, 180, 240, 300].map(angle => {
            const end = getSpokePosition(155, 95, angle, 10);
            return (
              <line
                key={`fw-${angle}`}
                x1="155" 
                y1="95"
                x2={end.x}
                y2={end.y}
                stroke="#22c55e"
                strokeWidth="1.5"
                opacity="0.7"
                style={{
                  transition: 'all 0.05s linear',
                  WebkitTransition: 'all 0.05s linear',
                }}
              />
            );
          })}
          <circle cx="155" cy="95" r="3" fill="#22c55e" opacity="0.8" />
        </g>
      )}

      {/* Headlights and details */}
      {!isBlueprint && !isAssembly && (
        <g opacity={detailOpacity}>
          {/* Main headlights - aggressive angle */}
          <rect x="182" y="65" width="10" height="5" rx="1" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
          
          {headlightOn ? (
            <>
              <ellipse 
                cx="187" 
                cy="67" 
                rx="25" 
                ry="10" 
                fill="url(#headlightGlow)" 
                opacity={headlightIntensity}
                style={{
                  transition: 'opacity 0.1s linear',
                  WebkitTransition: 'opacity 0.1s linear',
                }}
              />
              <circle cx="187" cy="67" r="3.5" fill="#fef9c3" />
            </>
          ) : (
            <circle cx="187" cy="67" r="3" fill="#333" />
          )}
          
          {/* Fog lights */}
          <circle cx="180" cy="78" r="2" fill={headlightOn ? '#f59e0b' : '#333'} opacity={headlightOn ? 0.8 : 0.5} />
          
          {/* Tail lights - aggressive */}
          <rect x="25" y="65" width="8" height="6" rx="1" fill={headlightOn ? '#dc2626' : '#1a1a1a'} opacity={headlightOn ? 0.9 : 0.5} />
          
          {/* Side mirrors - sporty */}
          <path d="M 68 52 L 62 46 L 65 46 L 71 51 Z" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
          <path d="M 152 52 L 158 46 L 155 46 L 149 51 Z" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
        </g>
      )}

      {/* Engine effects */}
      {isAcquired && (
        <g>
          {/* Hood glow */}
          <rect 
            x="70" 
            y="42" 
            width="60" 
            height="3" 
            rx="1" 
            fill="#22c55e" 
            opacity={engineGlow * 2}
            style={{
              transition: 'opacity 0.1s linear',
              WebkitTransition: 'opacity 0.1s linear',
            }}
          />
          
          {/* Exhaust flames */}
          <path
            d="M 193 80 L 198 81 L 193 82 Z"
            fill="#f59e0b"
            opacity={engineGlow * 3}
            style={{
              transition: 'opacity 0.1s linear',
              WebkitTransition: 'opacity 0.1s linear',
            }}
          />
          
          {/* Power aura */}
          <ellipse 
            cx="100" 
            cy="95" 
            rx="70" 
            ry="8" 
            fill="none"
            stroke="#22c55e"
            strokeWidth="0.5"
            opacity={engineGlow}
            style={{
              transition: 'opacity 0.1s linear',
              WebkitTransition: 'opacity 0.1s linear',
            }}
          />
        </g>
      )}
    </svg>
  );
}
