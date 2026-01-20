import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { guestCart } from '@/lib/guestCart';
import { API_BASE_URL, cartApi } from '@/lib/api';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'otp' | 'google'>('otp');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email to receive an OTP.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to send OTP. Please try again.');
      }

      setIsOtpSent(true);
      toast({
        title: 'OTP sent',
        description: 'Please check your email for the verification code.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message ?? 'Something went wrong while sending OTP.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email || !otp) {
      toast({
        title: 'Missing details',
        description: 'Please enter both your email and OTP.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsVerifying(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || 'Invalid or expired OTP. Please try again.');
      }

      if (data?.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authEmail', data.email ?? email);
        
        // Migrate guest cart to backend
        try {
          await guestCart.migrateToBackend(cartApi);
        } catch (error) {
          console.error('Failed to migrate cart:', error);
          // Don't block login if cart migration fails
        }
      }

      toast({
        title: 'Logged in',
        description: data?.message ?? 'You have been logged in successfully.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message ?? 'Something went wrong while verifying OTP.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };
  
  return (
    <Layout>
      <section className="section-padding relative min-h-[calc(100vh-200px)] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop&q=80" 
            alt="Background" 
            className="w-full h-full object-cover"
          />
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
        </div>
        
        <div className="container-custom max-w-md mx-auto relative z-10">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Welcome Back</h1>
            <p className="text-white/90">Sign in to your account to continue</p>
          </div>
          
          <div className="bg-card/95 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-white/20 shadow-2xl">
            <Tabs
              defaultValue="otp"
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'otp' | 'google')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="otp">Email OTP</TabsTrigger>
                <TabsTrigger value="google">Google</TabsTrigger>
              </TabsList>
              
              <TabsContent value="otp" className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Email address"
                    className="pl-10"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {isOtpSent && (
                  <div className="relative">
                    <Input
                      placeholder="Enter OTP"
                      className="pr-10"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    className="w-full btn-primary"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : isOtpSent ? 'Resend OTP' : 'Send OTP'}
                  </Button>
                  {isOtpSent && (
                    <Button
                      type="button"
                      className="w-full"
                      variant="outline"
                      onClick={handleVerifyOtp}
                      disabled={isVerifying}
                    >
                      {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="google" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Continue with your Google account. We&#39;ll create your profile automatically on first login.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </TabsContent>
            </Tabs>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-sm"><span className="bg-card px-2 text-muted-foreground">or continue with</span></div>
            </div>
            
            <p className="text-center text-xs text-muted-foreground mt-6">
              By continuing, you agree to our terms and privacy policy.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Login;
