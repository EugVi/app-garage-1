interface ProgressBarProps {
  pct: number;
  color?: string;
  height?: number;
  glow?: boolean;
  className?: string;
}

export function ProgressBar({ pct, color = '#22c55e', height = 6, glow = false, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div
      className={`w-full bg-white/5 rounded-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${clamped}%`,
          background: color,
          boxShadow: glow ? `0 0 8px ${color}80` : 'none',
        }}
      />
    </div>
  );
}
