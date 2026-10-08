import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, Key, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminAuthApi } from '@/lib/api';

const AdminForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await adminAuthApi.forgotPassword(email.trim());
      setSent(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not send reset email';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                <Key className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="font-cursive text-3xl md:text-4xl mb-2 text-foreground">
              Reset <span className="text-primary">Password</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your admin email and we&apos;ll send a reset link
            </p>
          </div>

          {sent ? (
            <div className="space-y-5 text-center">
              <CheckCircle className="w-12 h-12 text-primary mx-auto" />
              <p className="text-sm text-foreground leading-relaxed">
                Reset link sent to <strong>{email.trim()}</strong>. Check your inbox
                (and spam) — the link expires in 2 hours.
              </p>
              <Button asChild variant="outline" className="w-full h-12">
                <Link to="/admin-sara/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Admin email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="pl-10 h-12 bg-white border-border text-foreground placeholder:text-muted-foreground"
                  required
                  disabled={isLoading}
                />
              </div>

              {errorMessage && (
                <div className="text-destructive text-sm font-medium bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  {errorMessage}
                </div>
              )}

              <Button type="submit" className="w-full btn-primary h-12 text-base" disabled={isLoading || !email.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…
                  </>
                ) : (
                  'Send reset link'
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
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
