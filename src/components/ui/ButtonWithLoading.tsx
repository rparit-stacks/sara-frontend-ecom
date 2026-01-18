import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonWithLoadingProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  minimumDuration?: number;
}

export const ButtonWithLoading: React.FC<ButtonWithLoadingProps> = ({
  isLoading = false,
  loadingText,
  minimumDuration = 300,
  children,
  className,
  disabled,
  onClick,
  ...props
}) => {
  const [showLoading, setShowLoading] = React.useState(false);
  const loadingStartRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (isLoading) {
      loadingStartRef.current = Date.now();
      setShowLoading(true);
    } else if (loadingStartRef.current !== null) {
      const elapsed = Date.now() - loadingStartRef.current;
      const remaining = Math.max(0, minimumDuration - elapsed);
      
      if (remaining > 0) {
        const timeout = setTimeout(() => {
          setShowLoading(false);
          loadingStartRef.current = null;
        }, remaining);
        return () => clearTimeout(timeout);
      } else {
        setShowLoading(false);
        loadingStartRef.current = null;
      }
    }
  }, [isLoading, minimumDuration]);

  const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick && !disabled && !isLoading) {
      onClick(e);
    }
  }, [onClick, disabled, isLoading]);

  return (
    <Button
      {...props}
      className={cn(className)}
      disabled={disabled || isLoading || showLoading}
      onClick={handleClick}
    >
      {showLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText || 'Loading...'}
        </>
      ) : (
        children
      )}
    </Button>
  );
};
