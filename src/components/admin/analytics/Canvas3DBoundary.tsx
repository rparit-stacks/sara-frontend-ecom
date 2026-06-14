import { Component, ReactNode, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Shown if WebGL throws or is unavailable. */
  fallback?: ReactNode;
}

/**
 * Error boundary + Suspense around a WebGL canvas. If the GPU/WebGL context
 * fails (older devices, blocked contexts), we degrade gracefully instead of
 * crashing the whole dashboard.
 */
export class Canvas3DBoundary extends Component<Props, { failed: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        this.props.fallback ?? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            3D view unavailable on this device
          </div>
        )
      );
    }
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        }
      >
        {this.props.children}
      </Suspense>
    );
  }
}
