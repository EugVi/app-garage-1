interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: boolean;
  glowColor?: string;
}

export function GlassCard({ children, className = '', onClick, glow = false, glowColor = 'rgba(34,197,94,0.1)' }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white/[0.03] backdrop-blur-xl
        border border-white/[0.06]
        rounded-2xl
        ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform duration-150' : ''}
        ${className}
      `}
      style={glow ? { boxShadow: `0 0 30px ${glowColor}` } : undefined}
    >
      {children}
    </div>
  );
}
