import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { guestCart } from '@/lib/guestCart';
import { API_BASE_URL, authApi, cartApi } from '@/lib/api';
import { COUNTRY_CODES } from '@/lib/countryCodes';

type AuthTab = 'signup' | 'login';
type OtpMethod = 'email' | 'phone';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get returnTo path from location state
  const returnTo = (location.state as any)?.returnTo || '/dashboard';

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [loginMethod, setLoginMethod] = useState<OtpMethod>('email');

  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [phoneLookupResults, setPhoneLookupResults] = useState<Array<{ email: string; maskedEmail: string }> | null>(null);
  const [selectedPhoneEmail, setSelectedPhoneEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const resetOtpState = () => {
    setOtp('');
    setIsOtpSent(false);
    setIsLoading(false);
    setIsVerifying(false);
    setPhoneLookupResults(null);
    setSelectedPhoneEmail(null);
  };

  const extractErrorMessage = (error: any, fallback: string) => {
    const raw = error?.message ?? fallback;
    if (typeof raw !== 'string') return fallback;
    // Try to parse JSON error body like {"message":"..."}
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.message) {
        return String(parsed.message);
      }
    } catch {
      // ignore JSON parse failure
    }
    return raw;
  };

  const currentMethod: OtpMethod =
    activeTab === 'login' ? loginMethod : 'email';

  const handleSendOtp = async () => {
    try {
      if (activeTab === 'signup') {
        // Signup: always require email + phone
        if (!email || !phoneLocal) {
          toast({
            title: 'Email and mobile required',
            description: 'Please enter both your email and mobile number to receive a signup OTP.',
            variant: 'destructive',
          });
          return;
        }

        const digits = phoneLocal.replace(/\D/g, '');
        if (digits.length < 8 || digits.length > 15) {
          toast({
            title: 'Invalid mobile number',
            description: 'Please enter a valid mobile number (8–15 digits).',
            variant: 'destructive',
          });
          return;
        }

        const fullPhone = `${countryCode}${digits}`;
        setIsLoading(true);
        await authApi.requestOtp(email, fullPhone);
        setIsOtpSent(true);
        toast({
          title: 'Signup OTP sent',
          description: 'Please check your email and WhatsApp for the verification code.',
        });
        return;
      }

      // LOGIN FLOWS
      if (loginMethod === 'email') {
        // Login via email only
        if (!email) {
          toast({
            title: 'Email required',
            description: 'Please enter your email to receive a login OTP.',
            variant: 'destructive',
          });
          return;
        }
        setIsLoading(true);
        await authApi.requestLoginOtpByEmail(email);
        setIsOtpSent(true);
        toast({
          title: 'Login OTP sent',
          description: 'Please check your email and WhatsApp (if linked) for the verification code.',
        });
        return;
      }

      // Login via phone: step 1 is handled separately in UI (not using this function)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: extractErrorMessage(error, 'Something went wrong while sending OTP.'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const effectiveEmail =
      activeTab === 'login' && loginMethod === 'phone' && selectedPhoneEmail
        ? selectedPhoneEmail
        : email;

    if (!effectiveEmail || !otp) {
      toast({
        title: 'Missing details',
        description: 'Please enter OTP (and make sure an account is selected).',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsVerifying(true);
      const data = await authApi.verifyOtp(effectiveEmail, otp);

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authEmail', data.email ?? effectiveEmail);
      console.log('[Login] Token stored successfully, length:', data.token.length);

      // Migrate guest cart to backend
      try {
        await guestCart.migrateToBackend(cartApi);
      } catch (error) {
        console.error('Failed to migrate cart:', error);
        // Don't block login if cart migration fails
      }

      toast({
        title: activeTab === 'signup' ? 'Signup complete' : 'Logged in',
        description:
          data?.message ??
          (activeTab === 'signup'
            ? 'Your account has been created and you are now logged in.'
            : 'You have been logged in successfully.'),
      });

      // Small delay to ensure token is properly stored before navigation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to the intended page (dashboard by default) – dashboard will handle any mandatory profile popup
      navigate(returnTo, { replace: true });
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
      <section className="section-padding relative min-h-[calc(100vh-200px)] flex items-center py-10 md:py-16 overflow-hidden">
        {/* Full-page background image */}
        <div className="absolute inset-0 -z-10">
          <img
            src="/bg_images/9598237.jpg"
            alt="Studio Sara background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/70 dark:bg-background/80" />
        </div>

        <div className="container-custom max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Auth card */}
            <div
              className={`flex items-center transition-all duration-500 ease-out
              ${activeTab === 'signup'
                ? 'order-2 lg:order-1 opacity-100 translate-x-0'
                : 'order-2 lg:order-2 opacity-100 lg:-translate-x-4'}`}
            >
              <div className="w-full bg-card p-6 sm:p-8 md:p-10 rounded-2xl border shadow-lg">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-primary mb-2">
                    Studio Sara · Bespoke Ethnicwear
                  </p>
                  <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl">
                    {activeTab === 'signup' ? 'Create your account' : 'Welcome back'}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    {activeTab === 'signup'
                      ? 'Sign up to save your favourite sarees, lehengas and custom looks, and track every order easily.'
                      : 'Login to access your saved designs, measurements and order history in one place.'}
                  </p>
                </div>

                {/* Google - prominent at top */}
                <Button
                  type="button"
                  className="w-full h-11 sm:h-12 md:h-12 text-sm sm:text-base font-semibold gap-3 rounded-xl btn-primary"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="bg-card px-3 text-muted-foreground">
                      or use OTP
                    </span>
                  </div>
                </div>

                {/* Tabs: Signup vs Login */}
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => {
                    setActiveTab(v as AuthTab);
                    resetOtpState();
                  }}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="signup">Signup</TabsTrigger>
                    <TabsTrigger value="login">Login</TabsTrigger>
                  </TabsList>

                  {/* SIGNUP TAB */}
                  <TabsContent value="signup" className="mt-2 space-y-5">
                    <p className="text-xs text-muted-foreground mb-1">
                      Enter your <span className="font-semibold">email</span> and{' '}
                      <span className="font-semibold">WhatsApp number</span>. We’ll send a one-time
                      code to both to complete signup.
                    </p>

                    <div className="space-y-3">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          placeholder="Email address"
                          className="pl-10 h-11"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Select
                            value={countryCode}
                            onValueChange={(v) => setCountryCode(v)}
                          >
                            <SelectTrigger className="w-full sm:w-[120px] shrink-0">
                              <SelectValue placeholder="Code" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[280px] overflow-y-auto">
                              {COUNTRY_CODES.map((c) => (
                                <SelectItem key={c.code + c.country} value={c.code}>
                                  {c.code} {c.country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="relative flex-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              placeholder="Mobile number (WhatsApp)"
                              className="pl-10 h-11"
                              type="tel"
                              value={phoneLocal}
                              onChange={(e) =>
                                setPhoneLocal(e.target.value.replace(/\D/g, '').slice(0, 15))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {isOtpSent && (
                      <div className="relative">
                        <Input
                          placeholder="Enter OTP"
                          className="h-11"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      {isOtpSent ? (
                        <>
                          <Button
                            type="button"
                            className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold btn-primary rounded-xl"
                            onClick={handleVerifyOtp}
                            disabled={isVerifying}
                          >
                            {isVerifying ? 'Verifying...' : 'Verify & Signup'}
                          </Button>
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground text-xs"
                              onClick={handleSendOtp}
                              disabled={isLoading}
                            >
                              {isLoading ? 'Sending...' : 'Resend OTP'}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-11"
                          onClick={handleSendOtp}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Sending...' : 'Send OTP'}
                        </Button>
                      )}
                    </div>
                  </TabsContent>

                  {/* LOGIN TAB */}
                  <TabsContent value="login" className="mt-2 space-y-5">
                    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm mb-1">
                      <span className="font-medium text-muted-foreground">
                        Choose login method
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Button
                        type="button"
                        variant={loginMethod === 'email' ? 'default' : 'outline'}
                        className="h-9 text-xs sm:text-sm"
                        onClick={() => {
                          setLoginMethod('email');
                          resetOtpState();
                        }}
                      >
                        Email OTP
                      </Button>
                      <Button
                        type="button"
                        variant={loginMethod === 'phone' ? 'default' : 'outline'}
                        className="h-9 text-xs sm:text-sm"
                        onClick={() => {
                          setLoginMethod('phone');
                          resetOtpState();
                        }}
                      >
                        WhatsApp OTP
                      </Button>
                    </div>

                    {loginMethod === 'email' ? (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">
                          Login with just your <span className="font-semibold">email</span>. If your
                          account has a phone number saved, OTP will also go to WhatsApp.
                        </p>
                        <div className="space-y-3">
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              placeholder="Email address"
                              className="pl-10 h-11"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">
                          Login with your <span className="font-semibold">WhatsApp number</span>. Enter
                          your number and tap <span className="font-semibold">Login</span> to get an OTP.
                        </p>
                        <div className="space-y-3">
                          <div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Select
                                value={countryCode}
                                onValueChange={(v) => setCountryCode(v)}
                              >
                                <SelectTrigger className="w-full sm:w-[120px] shrink-0">
                                  <SelectValue placeholder="Code" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[280px] overflow-y-auto">
                                  {COUNTRY_CODES.map((c) => (
                                    <SelectItem key={c.code + c.country} value={c.code}>
                                      {c.code} {c.country}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="relative flex-1">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                  placeholder="Mobile number (WhatsApp)"
                                  className="pl-10 h-11"
                                  type="tel"
                                  value={phoneLocal}
                                  onChange={(e) =>
                                    setPhoneLocal(e.target.value.replace(/\D/g, '').slice(0, 15))
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          {phoneLookupResults && phoneLookupResults.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">
                                Accounts linked to this number:
                              </p>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {phoneLookupResults.map((u) => (
                                  <Button
                                    key={u.email}
                                    type="button"
                                    variant={
                                      selectedPhoneEmail === u.email ? 'default' : 'outline'
                                    }
                                    className="w-full h-9 justify-start text-xs sm:text-sm"
                                    onClick={() => setSelectedPhoneEmail(u.email)}
                                  >
                                    {u.maskedEmail}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {isOtpSent && (
                      <div className="relative">
                        <Input
                          placeholder="Enter OTP"
                          className="h-11"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      {isOtpSent ? (
                        <>
                          <Button
                            type="button"
                            className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold btn-primary rounded-xl"
                            onClick={handleVerifyOtp}
                            disabled={isVerifying}
                          >
                            {isVerifying ? 'Verifying...' : 'Verify & Login'}
                          </Button>
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground text-xs"
                              onClick={handleSendOtp}
                              disabled={isLoading}
                            >
                              {isLoading ? 'Sending...' : 'Resend OTP'}
                            </Button>
                          </div>
                        </>
                      ) : loginMethod === 'email' ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-11"
                          onClick={handleSendOtp}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Sending...' : 'Send OTP'}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-11"
                          onClick={async () => {
                            const digits = phoneLocal.replace(/\D/g, '');
                            if (!digits) {
                              toast({
                                title: 'Phone required',
                                description: 'Please enter your WhatsApp number to login.',
                                variant: 'destructive',
                              });
                              return;
                            }
                            const fullPhone = `${countryCode}${digits}`;
                            try {
                              setIsLoading(true);
                              const results = await authApi.lookupUsersByPhone(fullPhone);
                              setPhoneLookupResults(results);
                              if (!results || results.length === 0) {
                                setSelectedPhoneEmail(null);
                                toast({
                                  title: 'No account found',
                                  description: 'No account is linked to this number.',
                                });
                                return;
                              }
                              const emailToUse = selectedPhoneEmail || results[0]?.email;
                              setSelectedPhoneEmail(emailToUse || null);
                              if (!emailToUse) {
                                toast({
                                  title: 'Selection required',
                                  description: 'Please select an account to continue.',
                                  variant: 'destructive',
                                });
                                return;
                              }
                              await authApi.requestLoginOtpByEmail(emailToUse);
                              setIsOtpSent(true);
                              toast({
                                title: 'Login OTP sent',
                            description:
                              'Please check your email and WhatsApp for the verification code.',
                              });
                            } catch (error: any) {
                              toast({
                                title: 'Error',
                            description: extractErrorMessage(
                              error,
                              'Something went wrong while logging in with this number.'
                            ),
                                variant: 'destructive',
                              });
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <p className="text-center text-xs text-muted-foreground mt-6">
                  By continuing, you agree to our terms and privacy policy.
                </p>
              </div>
            </div>

            {/* Visual / image panel */}
            <div
              className={`relative hidden lg:flex items-center justify-center transition-all duration-500 ease-out
              ${activeTab === 'signup'
                ? 'order-1 lg:order-2 opacity-100 translate-x-0'
                : 'order-1 lg:order-1 opacity-100 lg:translate-x-4'}`}
            >
              <div className="relative w-full h-full min-h-[260px] rounded-2xl overflow-hidden shadow-lg bg-primary/10 border border-primary/20">
                <img
                  src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&h=800&fit=crop&q=80"
                  alt="Studio Sara fashion"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/50 to-primary/30" />
                <div className="relative z-10 p-8 flex flex-col justify-between h-full">
                  <div className="space-y-3 text-white transition-all duration-500">
                    <p className="text-xs uppercase tracking-[0.3em] opacity-80">
                      {activeTab === 'signup' ? 'New to Studio Sara?' : 'Your wardrobe, continued'}
                    </p>
                    <h2 className="font-serif text-2xl md:text-3xl leading-snug">
                      {activeTab === 'signup'
                        ? 'Sign up in seconds,\nbring every Saree & Lehenga under one roof.'
                        : 'Login instantly,\nresume styling where you left off.'}
                    </h2>
                    <p className="text-xs md:text-sm text-primary-foreground/80 max-w-sm">
                      {activeTab === 'signup'
                        ? 'Use email and WhatsApp OTP to create a secure Studio Sara profile, save looks and get real‑time order updates.'
                        : 'Use email or WhatsApp OTP to unlock your saved designs, fitting details and live order updates.'}
                    </p>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2 text-[11px] md:text-xs text-primary-foreground/90">
                    <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm">
                      OTP on WhatsApp & Email
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm">
                      No password needed
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm">
                      Secure & quick access
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Login;
