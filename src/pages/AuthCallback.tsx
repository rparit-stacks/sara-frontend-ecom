import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { guestCart } from '@/lib/guestCart';
import { cartApi } from '@/lib/api';

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (token) {
      localStorage.setItem('authToken', token);
      if (email) {
        localStorage.setItem('authEmail', email);
      }

      // Migrate guest cart to backend
      guestCart.migrateToBackend(cartApi).catch((error) => {
        console.error('Failed to migrate cart:', error);
        // Don't block login if cart migration fails
      });

      toast({
        title: 'Logged in with Google',
        description: 'You have been logged in successfully.',
      });

      navigate('/dashboard', { replace: true });
    } else {
      toast({
        title: 'Authentication failed',
        description: 'Could not complete Google login. Please try again.',
        variant: 'destructive',
      });
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate, toast]);

  return (
    <Layout>
      <section className="section-padding min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Completing sign in...</h1>
          <p className="text-muted-foreground text-sm">
            Please wait while we finish setting up your session.
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default AuthCallback;

