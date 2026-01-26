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
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          const sessionDuration = 60 * 60 * 1000; // 1 hour
          
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
    setErrorMessage(null); // Clear previous error
    
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
      // Show inline error instead of toast for wrong password
      const errorMsg = error.message || 'Invalid credentials';
      if (errorMsg.toLowerCase().includes('password') || errorMsg.toLowerCase().includes('wrong') || errorMsg.toLowerCase().includes('invalid')) {
        setErrorMessage('You have entered wrong password');
      } else {
        setErrorMessage(errorMsg);
      }
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
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/bg_images/bgimg.png')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/70 to-primary/90 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl border border-border shadow-2xl hover:shadow-primary/20 transition-shadow duration-300">
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                <Key className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="font-cursive text-3xl md:text-4xl mb-2 text-foreground">
              Admin <span className="text-primary">Login</span>
            </h1>
            <p className="text-muted-foreground text-sm">Secure access to the admin panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(null); // Clear error when user types
                }}
                className="pl-10 h-12 bg-white border-border text-foreground placeholder:text-muted-foreground"
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null); // Clear error when user types
                }}
                className={`pl-10 pr-10 h-12 bg-white border-border text-foreground placeholder:text-muted-foreground ${
                  errorMessage ? 'border-destructive' : ''
                }`}
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

            {/* Inline Error Message */}
            {errorMessage && (
              <div className="text-destructive text-sm font-medium bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {errorMessage}
              </div>
            )}

            <Button type="submit" className="w-full btn-primary h-12 text-base" disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing In...</> : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
