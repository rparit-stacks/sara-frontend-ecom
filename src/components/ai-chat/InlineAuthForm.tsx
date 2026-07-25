import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AuthStage } from './types';

interface InlineAuthFormProps {
  authStage: AuthStage;
  onSubmitEmail: (email: string) => void;
  onSubmitOtp: (otp: string) => void;
  onResend: () => void;
  error?: string | null;
}

/**
 * Rendered inline in the message flow (not a separate modal) so the OTP verification feels
 * like part of the conversation, per spec: "OTP login inside chat, without leaving the widget."
 */
export function InlineAuthForm({ authStage, onSubmitEmail, onSubmitOtp, onResend, error }: InlineAuthFormProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  if (authStage.stage === 'none') return null;

  const isVerifying = authStage.stage === 'verifying';

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSubmitEmail(email.trim());
  };

  const handleOtpSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    onSubmitOtp(otp.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="ml-9 flex max-w-[85%] flex-col gap-3 rounded-2xl rounded-bl-md bg-white p-4 shadow-soft ring-1 ring-black/[0.06]"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Quick verification needed
      </div>

      {authStage.stage === 'awaiting-email' && (
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
            className="h-10 rounded-xl"
          />
          <Button type="submit" size="sm" className="rounded-full" disabled={!email.trim()}>
            Send OTP
          </Button>
        </form>
      )}

      {(authStage.stage === 'awaiting-otp' || isVerifying) && (
        <form onSubmit={handleOtpSubmit} className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Code sent to {authStage.stage === 'awaiting-otp' ? authStage.email : ''}
          </p>
          <Input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            autoFocus
            disabled={isVerifying}
            className="h-10 rounded-xl tracking-widest"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              className="flex-1 rounded-full"
              disabled={isVerifying || otp.length < 4}
            >
              {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={onResend}
              disabled={isVerifying}
            >
              Resend
            </Button>
          </div>
        </form>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </motion.div>
  );
}
