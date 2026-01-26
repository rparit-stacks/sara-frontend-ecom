import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, Lock, Eye, EyeOff, Loader2, Key, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { adminManagementApi } from '@/lib/api';

const AdminInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Fetch invite details
  const { data: inviteData, isLoading: inviteLoading, error: inviteError } = useQuery({
    queryKey: ['adminInvite', token],
    queryFn: () => adminManagementApi.getInviteByToken(token!),
    enabled: !!token,
    retry: false,
  });
  
  // Set email from invite data
  useEffect(() => {
    if (inviteData?.email) {
      setEmail(inviteData.email);
    }
  }, [inviteData]);
  
  // Accept invite mutation
  const acceptInviteMutation = useMutation({
    mutationFn: (data: { token: string; name: string; password: string; confirmPassword: string }) =>
      adminManagementApi.acceptInvite(data),
    onSuccess: () => {
      toast.success('Admin account created successfully!');
      navigate('/admin-sara/login');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Failed to create admin account');
    },
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    // Validation
    if (!name.trim()) {
      setErrorMessage('Name is required');
      return;
    }
    if (!password) {
      setErrorMessage('Password is required');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    if (!token) {
      setErrorMessage('Invalid invitation token');
      return;
    }
    
    setIsLoading(true);
    acceptInviteMutation.mutate({
      token,
      name: name.trim(),
      password,
      confirmPassword,
    }, {
      onSettled: () => {
        setIsLoading(false);
      }
    });
  };
  
  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (inviteError || !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
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
        
        <div className="relative z-10 w-full max-w-md mx-auto px-4">
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl border border-border shadow-2xl">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="font-cursive text-3xl md:text-4xl mb-2 text-foreground">
                Invalid Invitation
              </h1>
              <p className="text-muted-foreground mb-6">
                This invitation link is invalid or has expired. Please contact an administrator for a new invitation.
              </p>
              <Button onClick={() => navigate('/admin-sara/login')} className="btn-primary">
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (inviteData.status === 'ACCEPTED') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
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
        
        <div className="relative z-10 w-full max-w-md mx-auto px-4">
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl border border-border shadow-2xl">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="font-cursive text-3xl md:text-4xl mb-2 text-foreground">
                Invitation Already Accepted
              </h1>
              <p className="text-muted-foreground mb-6">
                This invitation has already been used. Please login with your credentials.
              </p>
              <Button onClick={() => navigate('/admin-sara/login')} className="btn-primary">
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (inviteData.status === 'EXPIRED') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
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
        
        <div className="relative z-10 w-full max-w-md mx-auto px-4">
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl border border-border shadow-2xl">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="font-cursive text-3xl md:text-4xl mb-2 text-foreground">
                Invitation Expired
              </h1>
              <p className="text-muted-foreground mb-6">
                This invitation has expired. Please contact an administrator for a new invitation.
              </p>
              <Button onClick={() => navigate('/admin-sara/login')} className="btn-primary">
                Go to Login
              </Button>
            </div>
          </div>
        </div>
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
              Create Admin <span className="text-primary">Account</span>
            </h1>
            <p className="text-muted-foreground text-sm">You've been invited to join the admin panel</p>
            {inviteData.invitedBy && (
              <p className="text-muted-foreground text-xs mt-1">Invited by: {inviteData.invitedBy}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-foreground">Full Name *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="pl-10 h-12 bg-white border-border text-foreground placeholder:text-muted-foreground"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="pl-10 h-12 bg-muted border-border text-muted-foreground cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Email is pre-filled from invitation</p>
            </div>

            <div>
              <Label htmlFor="password" className="text-foreground">Password *</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password (min 6 characters)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  className={`pl-10 pr-10 h-12 bg-white border-border text-foreground placeholder:text-muted-foreground ${
                    errorMessage ? 'border-destructive' : ''
                  }`}
                  required
                  minLength={6}
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
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password *</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  className={`pl-10 pr-10 h-12 bg-white border-border text-foreground placeholder:text-muted-foreground ${
                    errorMessage ? 'border-destructive' : ''
                  }`}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Inline Error Message */}
            {errorMessage && (
              <div className="text-destructive text-sm font-medium bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {errorMessage}
              </div>
            )}

            <Button type="submit" className="w-full btn-primary h-12 text-base" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...
                </>
              ) : (
                'Create Admin Account'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminInvite;
