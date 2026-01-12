import { memo } from 'react';

const FloatingCurlyLines = memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Top-left curly line - drifts right */}
      <svg
        className="absolute -top-10 -left-20 w-[300px] h-[150px] sm:w-[400px] sm:h-[200px] lg:w-[500px] lg:h-[250px] opacity-[0.06] animate-float-drift-right"
        viewBox="0 0 400 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 100 Q60 40, 100 100 T180 100 T260 100 T340 100"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-primary"
        />
        <path
          d="M40 130 Q80 70, 120 130 T200 130 T280 130"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-accent"
        />
      </svg>

      {/* Top-right abstract wave - drifts left */}
      <svg
        className="absolute -top-5 -right-16 w-[250px] h-[120px] sm:w-[350px] sm:h-[160px] lg:w-[450px] lg:h-[200px] opacity-[0.05] animate-float-drift-left"
        viewBox="0 0 350 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 80 C50 20, 90 140, 130 80 S210 20, 250 80 S330 140, 340 80"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-primary"
        />
        <path
          d="M30 110 C70 50, 110 170, 150 110 S230 50, 270 110"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="text-secondary-foreground/50"
        />
      </svg>

      {/* Middle-left curly spiral - slow drift */}
      <svg
        className="absolute top-1/3 -left-10 w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] lg:w-[350px] lg:h-[350px] opacity-[0.04] animate-float-drift-slow"
        viewBox="0 0 280 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M140 60 Q180 80, 180 120 Q180 160, 140 180 Q100 200, 80 160 Q60 120, 100 100 Q140 80, 160 120"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-primary"
        />
        <path
          d="M120 90 Q150 100, 150 130 Q150 160, 120 170"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="text-accent"
        />
      </svg>

      {/* Middle-right flowing line - drifts left */}
      <svg
        className="absolute top-1/2 -right-12 w-[180px] h-[300px] sm:w-[240px] sm:h-[400px] lg:w-[300px] lg:h-[500px] opacity-[0.05] animate-float-drift-left-slow"
        viewBox="0 0 240 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M200 20 Q160 80, 180 140 Q200 200, 160 260 Q120 320, 180 380"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-primary"
        />
        <path
          d="M220 50 Q180 110, 200 170 Q220 230, 180 290"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="text-tertiary"
        />
      </svg>

      {/* Bottom-left wave cluster */}
      <svg
        className="absolute bottom-20 -left-16 w-[280px] h-[140px] sm:w-[380px] sm:h-[180px] lg:w-[480px] lg:h-[220px] opacity-[0.045] animate-float-drift-right-slow"
        viewBox="0 0 380 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 90 Q70 30, 120 90 T220 90 T320 90"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-primary"
        />
        <path
          d="M40 120 Q90 60, 140 120 T240 120 T340 120"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-accent"
        />
        <path
          d="M10 150 Q60 90, 110 150 T210 150"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="text-muted-foreground/30"
        />
      </svg>

      {/* Bottom-right abstract curves */}
      <svg
        className="absolute -bottom-10 -right-20 w-[220px] h-[180px] sm:w-[300px] sm:h-[240px] lg:w-[380px] lg:h-[300px] opacity-[0.04] animate-float-drift-left"
        viewBox="0 0 300 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M280 40 C240 60, 220 120, 260 160 C300 200, 240 220, 200 200"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-primary"
        />
        <path
          d="M260 80 C220 100, 200 160, 240 200"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-accent"
        />
        <path
          d="M240 60 Q200 80, 200 120 Q200 160, 240 180"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="text-tertiary"
        />
      </svg>

      {/* Center decorative swirl - very subtle */}
      <svg
        className="absolute top-2/3 left-1/4 w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] opacity-[0.03] animate-float-drift-slow"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 40 Q140 60, 140 100 Q140 140, 100 160 Q60 140, 60 100 Q60 60, 100 40"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-primary"
        />
      </svg>
    </div>
  );
});

FloatingCurlyLines.displayName = 'FloatingCurlyLines';

export default FloatingCurlyLines;
