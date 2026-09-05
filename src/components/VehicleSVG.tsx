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

  // Opacity levels based on progress
  const blueprintOpacity = isBlueprint ? 0.3 + (progress / 30) * 0.2 : 0;
  const bodyOpacity = isAssembly ? 0.4 + ((progress - 30) / 40) * 0.3 : isFinal || isAcquired ? 0.8 : 0;
  const detailOpacity = isFinal ? 0.6 + ((progress - 70) / 30) * 0.4 : isAcquired ? 1 : 0;
  const headlightOn = isAcquired;

  return (
    <svg
      width={size}
      height={size * 0.62}
      viewBox="0 0 200 124"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
    >
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="50%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id="bodyHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="neonGreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="amberGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <radialGradient id="headlightGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="1" />
          <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="floorReflection" cx="0.5" cy="0" r="0.5">
          <stop offset="0%" stopColor="#22c55e" stopOpacity={isAcquired ? 0.15 : 0.05} />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        {isBlueprint && (
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#22c55e" strokeWidth="0.2" opacity="0.3" />
          </pattern>
        )}
      </defs>

      {/* Floor reflection / spotlight */}
      <ellipse cx="100" cy="115" rx="80" ry="8" fill="url(#floorReflection)" />

      {/* Blueprint wireframe layer */}
      {isBlueprint && (
        <g opacity={blueprintOpacity}>
          <rect x="20" y="20" width="160" height="84" fill="url(#grid)" opacity="0.3" />
          {/* Chassis outline */}
          <path
            d="M 30 90 L 30 75 Q 30 60 45 55 L 70 48 Q 80 35 100 35 L 130 35 Q 150 35 160 48 L 175 55 Q 180 60 180 75 L 180 90"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1"
            strokeDasharray="3 2"
            opacity="0.6"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="10" dur="0.5s" repeatCount="indefinite" />
          </path>
          {/* Wheel positions */}
          <circle cx="55" cy="92" r="14" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="2 1" opacity="0.5" />
          <circle cx="155" cy="92" r="14" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="2 1" opacity="0.5" />
          {/* Scan line */}
          <line x1="20" y1="30" x2="180" y2="30" stroke="#22c55e" strokeWidth="0.5" opacity="0.4">
            <animate attributeName="y1" values="30;110;30" dur="3s" repeatCount="indefinite" />
            <animate attributeName="y2" values="30;110;30" dur="3s" repeatCount="indefinite" />
          </line>
          {/* Technical labels */}
          <text x="25" y="28" fill="#22c55e" fontSize="3" opacity="0.4" fontFamily="monospace">CHASSIS-01</text>
          <text x="140" y="28" fill="#22c55e" fontSize="3" opacity="0.4" fontFamily="monospace">SCAN...</text>
        </g>
      )}

      {/* Vehicle body — assembly and beyond */}
      {!isBlueprint && (
        <g opacity={bodyOpacity}>
          {/* Main body */}
          <path
            d="M 30 90 L 30 76 Q 30 62 46 57 L 68 50 Q 78 38 100 38 L 128 38 Q 150 38 158 50 L 174 57 Q 180 62 180 76 L 180 90 L 30 90 Z"
            fill="url(#bodyGrad)"
            stroke={isAcquired ? '#22c55e' : '#333'}
            strokeWidth="0.8"
          />
          {/* Body highlight */}
          <path
            d="M 40 62 Q 60 50 100 48 Q 140 50 160 62"
            fill="none"
            stroke="url(#bodyHighlight)"
            strokeWidth="3"
          />
          {/* Roof line */}
          <path
            d="M 70 46 Q 80 40 100 40 L 128 40 Q 148 40 156 48"
            fill="none"
            stroke={isAcquired ? '#22c55e' : '#444'}
            strokeWidth="1"
            opacity="0.8"
          />

          {/* Windows */}
          <g opacity={detailOpacity * 0.7}>
            <path d="M 74 50 Q 82 44 98 44 L 112 44 L 112 54 L 72 54 Z" fill="#1e3a5f" opacity="0.6" stroke="#3b5998" strokeWidth="0.5" />
            <path d="M 114 44 L 126 44 Q 142 44 150 50 L 150 54 L 114 54 Z" fill="#1e3a5f" opacity="0.6" stroke="#3b5998" strokeWidth="0.5" />
          </g>

          {/* Door line */}
          <line x1="100" y1="56" x2="100" y2="88" stroke="#222" strokeWidth="0.5" opacity={detailOpacity} />

          {/* Side panel details */}
          <line x1="50" y1="70" x2="170" y2="70" stroke="#333" strokeWidth="0.3" opacity={detailOpacity * 0.5} />
        </g>
      )}

      {/* Wheels — final assembly and beyond */}
      {!isBlueprint && !isAssembly && (
        <g opacity={detailOpacity}>
          {/* Rear wheel */}
          <circle cx="55" cy="92" r="13" fill="#0a0a0a" stroke="#222" strokeWidth="1" />
          <circle cx="55" cy="92" r="9" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
          <circle cx="55" cy="92" r="4" fill="#222" />
          {/* 5 spokes */}
          {[0, 72, 144, 216, 288].map(angle => (
            <line
              key={`rw-${angle}`}
              x1="55" y1="92"
              x2={55 + Math.cos((angle * Math.PI) / 180) * 8}
              y2={92 + Math.sin((angle * Math.PI) / 180) * 8}
              stroke="#444"
              strokeWidth="1"
            />
          ))}

          {/* Front wheel */}
          <circle cx="155" cy="92" r="13" fill="#0a0a0a" stroke="#222" strokeWidth="1" />
          <circle cx="155" cy="92" r="9" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
          <circle cx="155" cy="92" r="4" fill="#222" />
          {[0, 72, 144, 216, 288].map(angle => (
            <line
              key={`fw-${angle}`}
              x1="155" y1="92"
              x2={155 + Math.cos((angle * Math.PI) / 180) * 8}
              y2={92 + Math.sin((angle * Math.PI) / 180) * 8}
              stroke="#444"
              strokeWidth="1"
            />
          ))}
        </g>
      )}

      {/* Headlights — final assembly and acquired */}
      {!isBlueprint && !isAssembly && (
        <g opacity={detailOpacity}>
          {/* Headlight housing */}
          <rect x="168" y="64" width="10" height="6" rx="2" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
          {/* Headlight glow when acquired */}
          {headlightOn ? (
            <>
              <ellipse cx="173" cy="67" rx="20" ry="8" fill="url(#headlightGlow)" opacity="0.7" />
              <circle cx="173" cy="67" r="3" fill="#fef9c3" />
            </>
          ) : (
            <circle cx="173" cy="67" r="2.5" fill="#333" />
          )}

          {/* Tail light */}
          <rect x="30" y="64" width="6" height="5" rx="1" fill={headlightOn ? '#dc2626' : '#1a1a1a'} opacity={headlightOn ? 0.8 : 0.5} />

          {/* Mirrors */}
          <path d="M 68 50 L 64 44 L 66 44 L 70 49 Z" fill="#1a1a1a" stroke="#333" strokeWidth="0.3" />
          <path d="M 156 50 L 160 44 L 158 44 L 154 49 Z" fill="#1a1a1a" stroke="#333" strokeWidth="0.3" />
        </g>
      )}

      {/* Engine vibration animation when acquired */}
      {isAcquired && (
        <g>
          <rect x="90" y="88" width="30" height="2" rx="1" fill="#22c55e" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.5s" repeatCount="indefinite" />
          </rect>
          {/* Subtle glow under vehicle */}
          <ellipse cx="100" cy="92" rx="60" ry="4" fill="#22c55e" opacity="0.05">
            <animate attributeName="opacity" values="0.05;0.12;0.05" dur="2s" repeatCount="indefinite" />
          </ellipse>
        </g>
      )}
    </svg>
  );
}
