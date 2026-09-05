import { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  color: string;
  size: number;
  shape: 'rect' | 'circle';
}

const COLORS = ['#22c55e', '#f59e0b', '#f97316', '#3b82f6', '#ec4899', '#10b981', '#eab308'];

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      onComplete?.();
      return;
    }

    const newParticles: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      newParticles.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 30,
        y: 50,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 12 - 6,
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      });
    }
    setParticles(newParticles);

    const start = performance.now();
    let raf: number;
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx * 0.1,
        y: p.y + p.vy * 0.1 + elapsed * elapsed * 25,
        rotation: p.rotation + p.vr,
        vy: p.vy + 0.5,
      })));

      if (elapsed < 3) {
        raf = requestAnimationFrame(animate);
      } else {
        setParticles([]);
        onComplete?.();
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [active, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.shape === 'rect' ? p.size * 0.6 : p.size,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
            opacity: Math.max(0, 1 - (particles.indexOf(p) / particles.length) * 0.3),
          }}
        />
      ))}
    </div>
  );
}
