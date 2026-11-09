import { useId } from 'react';

type Variant = 'wash' | 'rings' | 'arches';

export const Abstract = ({ variant, className = '', dark = false }: { variant: Variant; className?: string; dark?: boolean }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ink = dark ? '#F3EEE4' : '#0B2530';
  const teal = dark ? '#6FCFC0' : '#2C9B8A';
  const mint = dark ? '#2C9B8A' : '#8FD3C7';
  const base = `pointer-events-none absolute ${className}`;

  if (variant === 'arches') {
    // nested arch outlines, like a jaali window, rising from the bottom edge
    return (
      <svg aria-hidden viewBox="0 0 600 600" preserveAspectRatio="xMidYMax meet" className={base}>
        {[260, 215, 170, 125, 80].map((r, i) => (
          <path key={r} d={`M${300 - r} 600 V${300} A${r} ${r} 0 0 1 ${300 + r} 300 V600`} fill="none"
            stroke={i % 2 ? ink : teal} strokeWidth="1.5" opacity={i % 2 ? 0.2 : 0.45} />
        ))}
        <circle cx="300" cy="300" r="26" fill={teal} opacity="0.3" />
      </svg>
    );
  }

  if (variant === 'rings') {
    return (
      <svg aria-hidden viewBox="0 0 800 800" className={`${base} ed-drift`}>
        {[70, 120, 170, 220, 270, 320, 370].map((r, i) => (
          <circle key={r} cx="400" cy="400" r={r} fill="none" stroke={i % 3 === 0 ? teal : ink} strokeWidth="1.5"
            strokeDasharray={i % 2 ? '3 10' : '14 8'} opacity={i % 3 === 0 ? 0.5 : 0.22} />
        ))}
        <circle cx="400" cy="400" r="34" fill={teal} opacity="0.3" />
        <circle cx="400" cy="400" r="14" fill={mint} opacity="0.8" />
      </svg>
    );
  }

  // wash: overlapping soft colour pools, like dye bleeding into cloth
  return (
    <svg aria-hidden viewBox="0 0 800 800" className={base}>
      <defs>
        <filter id={`b${id}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="55" /></filter>
      </defs>
      <g filter={`url(#b${id})`}>
        <ellipse cx="520" cy="300" rx="260" ry="210" fill={teal} opacity="0.2" />
        <ellipse cx="300" cy="520" rx="230" ry="190" fill={mint} opacity="0.35" />
        <ellipse cx="620" cy="560" rx="170" ry="150" fill={ink} opacity="0.08" />
      </g>
    </svg>
  );
};
