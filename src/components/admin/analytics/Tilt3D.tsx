import { ReactNode } from 'react';

interface Tilt3DProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Theme card with a soft depth shadow that lifts on hover. No tilt/movement —
 * keeps the dashboard calm and readable (client-facing).
 */
export function Tilt3D({ children, className = '', onClick }: Tilt3DProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-border shadow-sm hover:shadow-lg transition-shadow duration-300 ${
        onClick ? 'cursor-pointer hover:border-primary' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
