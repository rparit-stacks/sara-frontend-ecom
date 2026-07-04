/** Material Symbols icon — scoped to the portal theme (`.msym`). */
export const Sym = ({
  name,
  className = '',
  fill = false,
  style,
}: {
  name: string;
  className?: string;
  fill?: boolean;
  style?: React.CSSProperties;
}) => (
  <span className={`msym ${fill ? 'fill' : ''} ${className}`} style={style}>
    {name}
  </span>
);
