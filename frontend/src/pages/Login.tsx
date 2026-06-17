import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ArrowRight, Eye, EyeOff } from "lucide-react";
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuth(data.user, data.token, data.refreshToken);
      navigate('/');
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sage/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gold/8 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '4s' }} />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0 shadow-xl shadow-black/5 bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center pb-8 pt-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl shadow-lg shadow-primary/10">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to manage your wealth
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-8">
            {serverError && (
              <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-2xl border border-destructive/20">
                {serverError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <Input 
                type="email" 
                placeholder="you@example.com" 
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-xs text-destructive font-medium mt-1">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password"
                  className={errors.password ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive font-medium mt-1">{errors.password}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-5 px-8 pb-8">
            <Button className="w-full h-12 text-base font-bold" type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Sign Up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
