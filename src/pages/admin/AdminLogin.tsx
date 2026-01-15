import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Loader2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { adminAuthApi } from '@/lib/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setIsChecking(false);
        return;
      }

      try {
        await adminAuthApi.getCurrentAdmin();
        // Check session timeout
        const loginTime = localStorage.getItem('adminLoginTime');
        if (loginTime) {
          const loginTimestamp = parseInt(loginTime);
          const now = Date.now();
          const sessionDuration = 10 * 60 * 1000; // 10 minutes
          
          if (now - loginTimestamp <= sessionDuration) {
            // Session still valid, redirect to dashboard
            const from = (location.state as any)?.from?.pathname || '/admin-sara';
            navigate(from, { replace: true });
            return;
          }
        }
        // Session expired or no login time
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminLoginTime');
        setIsChecking(false);
      } catch (error) {
        // Token is invalid, clear it
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminLoginTime');
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('[Admin Login] Attempting login with email:', email);
      const response = await adminAuthApi.login(email, password);
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('adminUser', JSON.stringify(response.admin));
      localStorage.setItem('adminLoginTime', Date.now().toString());
      console.log('[Admin Login] Login successful, token saved, session started');
      toast.success('Login successful');
      
      // Redirect to the page they were trying to access, or dashboard
      const from = (location.state as any)?.from?.pathname || '/admin-sara';
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('[Admin Login] Login failed:', error);
      toast.error(error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('[Admin Signup] Attempting signup with email:', email);
      const response = await adminAuthApi.signup(email, password, name, authCode);
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('adminUser', JSON.stringify(response.admin));
      localStorage.setItem('adminLoginTime', Date.now().toString());
      console.log('[Admin Signup] Signup successful, token saved, session started');
      toast.success('Account created successfully!');
      
      // Redirect to dashboard
      navigate('/admin-sara', { replace: true });
    } catch (error: any) {
      console.error('[Admin Signup] Signup failed:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop&q=80" 
          alt="Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/70 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="bg-card/95 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="font-cursive text-3xl md:text-4xl mb-2 text-white">
              Admin <span className="text-primary">{activeTab === 'login' ? 'Login' : 'Sign Up'}</span>
            </h1>
            <p className="text-white/80">Access the admin panel</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-white/10 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setEmail('');
                setPassword('');
                setName('');
                setAuthCode('');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'login'
                  ? 'bg-primary text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setEmail('');
                setPassword('');
                setName('');
                setAuthCode('');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'signup'
                  ? 'bg-primary text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white/90"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-white/90"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Button type="submit" className="w-full btn-primary h-12 text-base" disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing In...</> : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 bg-white/90"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white/90"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-white/90"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Authentication Code"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  className="pl-10 h-12 bg-white/90"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full btn-primary h-12 text-base" disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</> : 'Create Account'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
