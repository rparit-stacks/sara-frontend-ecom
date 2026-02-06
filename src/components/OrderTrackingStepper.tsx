import { motion } from 'framer-motion';
import { Package, CheckCircle2, Truck, Home, XCircle, Loader2 } from 'lucide-react';

const STEPS = [
  { key: 'PENDING', label: 'Order Placed', icon: Package },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'PROCESSING', label: 'Processing', icon: Loader2 },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Home },
];

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export function OrderTrackingStepper({ status }: { status: string }) {
  const normalizedStatus = (status || 'PENDING').toUpperCase();
  const isCancelled = normalizedStatus === 'CANCELLED';
  const currentIndex = STATUS_ORDER.indexOf(normalizedStatus);
  const effectiveIndex = currentIndex >= 0 ? currentIndex : 0;

  if (isCancelled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex items-center gap-4"
      >
        <div className="rounded-full bg-destructive/20 p-3">
          <XCircle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <p className="font-semibold text-destructive">Order Cancelled</p>
          <p className="text-sm text-muted-foreground">This order has been cancelled.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-border bg-card p-6 overflow-hidden"
    >
      <h3 className="font-semibold mb-6">Order Tracking</h3>
      <div className="relative">
        {/* Background track */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted rounded-full" style={{ marginLeft: '5%', marginRight: '5%' }} />
        {/* Animated progress track */}
        <motion.div
          className="absolute top-5 left-0 h-0.5 bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(effectiveIndex / (STEPS.length - 1)) * 90}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ marginLeft: '5%' }}
        />
        {/* Steps */}
        <div className="relative flex justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = index < effectiveIndex;
            const isCurrent = index === effectiveIndex;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2 relative z-10
                    ${isCompleted ? 'bg-primary text-primary-foreground' : ''}
                    ${isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/30 shadow-lg' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isCurrent && step.key === 'PROCESSING' ? 'animate-spin' : ''}`} />
                  )}
                </div>
                <p className={`text-xs font-medium text-center max-w-[70px] ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
