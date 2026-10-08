import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, Key, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { adminAuthApi } from '@/lib/api';

const AdminResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [invalidMessage, setInvalidMessage] = useState('Invalid or expired reset link');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setChecking(false);
      return;
    }
    adminAuthApi
      .getResetPassword(token)
      .then((data) => {
        setEmail(data.email);
        setChecking(false);
      })
      .catch((error: unknown) => {
        setInvalidMessage(error instanceof Error ? error.message : 'Invalid or expired reset link');
        setInvalid(true);
        setChecking(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    if (!token) return;

    setIsLoading(true);
    try {
      await adminAuthApi.resetPassword({ token, password, confirmPassword });
      setDone(true);
      toast.success('Password updated');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/bg_images/bgimg.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/70 to-primary/90 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl border border-border shadow-2xl">
          {invalid ? (
            <div className="text-center space-y-4">
              <XCircle className="w-16 h-16 text-destructive mx-auto" />
              <h1 className="font-cursive text-3xl text-foreground">Link expired</h1>
              <p className="text-sm text-muted-foreground">{invalidMessage}</p>
              <Button asChild className="w-full h-12 btn-primary">
                <Link to="/admin-sara/forgot-password">Request a new link</Link>
              </Button>
            </div>
          ) : done ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-primary mx-auto" />
              <h1 className="font-cursive text-3xl text-foreground">Password updated</h1>
              <p className="text-sm text-muted-foreground">
                You can sign in with your new password now.
              </p>
              <Button className="w-full h-12 btn-primary" onClick={() => navigate('/admin-sara/login')}>
                Go to login
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                    <Key className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h1 className="font-cursive text-3xl md:text-4xl mb-2 text-foreground">
                  New <span className="text-primary">Password</span>
                </h1>
                <p className="text-muted-foreground text-sm">
                  {email ? `Resetting password for ${email}` : 'Choose a new password'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="pl-10 pr-10 h-12 bg-white border-border"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="pl-10 pr-10 h-12 bg-white border-border"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {errorMessage && (
                  <div className="text-destructive text-sm font-medium bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    {errorMessage}
                  </div>
                )}

                <Button type="submit" className="w-full btn-primary h-12 text-base" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
                    </>
                  ) : (
                    'Update password'
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    to="/admin-sara/login"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;
