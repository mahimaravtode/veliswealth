import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FinLeapLogo } from "@/components/FinLeapLogo";
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  
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
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <FinLeapLogo className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Enter your email to sign in to your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {serverError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input 
                type="email" 
                placeholder="m@example.com" 
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-xs text-destructive font-medium">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input 
                type="password" 
                className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <p className="text-xs text-destructive font-medium">{errors.password}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Sign Up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
