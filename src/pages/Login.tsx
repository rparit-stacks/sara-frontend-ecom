import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-custom max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl md:text-4xl mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>
          
          <div className="bg-card p-6 md:p-8 rounded-2xl border border-border">
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="otp">OTP Login</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input placeholder="Email address" className="pl-10" type="email" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input placeholder="Password" className="pl-10 pr-10" type={showPassword ? 'text' : 'password'} />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <Button className="w-full btn-primary">Sign In</Button>
              </TabsContent>
              
              <TabsContent value="otp" className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input placeholder="Email or phone number" className="pl-10" />
                </div>
                <Button className="w-full btn-primary">Send OTP</Button>
              </TabsContent>
            </Tabs>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-sm"><span className="bg-card px-2 text-muted-foreground">or continue with</span></div>
            </div>
            
            <Button variant="outline" className="w-full gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </Button>
            
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account? <a href="#" className="text-primary hover:underline">Sign up</a>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Login;
