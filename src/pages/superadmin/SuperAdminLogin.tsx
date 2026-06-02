import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { superAdminAuthApi } from '@/lib/api';

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    if (!email.trim()) {
      toast.error('Enter your email');
      return;
    }
    setLoading(true);
    try {
      await superAdminAuthApi.requestOtp(email.trim());
      toast.success('OTP sent to your email');
      setStep('otp');
    } catch (err: any) {
      toast.error(err.message || 'Not authorized as super admin');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      toast.error('Enter the OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await superAdminAuthApi.verifyOtp(email.trim(), otp.trim());
      localStorage.setItem('superAdminToken', res.token);
      localStorage.setItem('superAdminLoginTime', Date.now().toString());
      localStorage.setItem('superAdminEmail', res.email);
      toast.success('Welcome, Super Admin');
      navigate('/super-admin');
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>Super Admin Login</CardTitle>
          <CardDescription>
            {step === 'email' ? 'Sign in with a one-time password sent to your email.' : `Enter the OTP sent to ${email}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'email' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && requestOtp()}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <Button className="w-full" onClick={requestOtp} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">One-time password</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
                  placeholder="6-digit code"
                  autoFocus
                />
              </div>
              <Button className="w-full" onClick={verifyOtp} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verify &amp; sign in
              </Button>
              <Button variant="ghost" className="w-full gap-2" onClick={() => setStep('email')} disabled={loading}>
                <ArrowLeft className="h-4 w-4" />
                Use a different email
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminLogin;
