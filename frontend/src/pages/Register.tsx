import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FinLeapLogo } from "@/components/FinLeapLogo";
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

declare global {
  interface Window {
    google?: any;
  }
}

const TEMP_EMAIL_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', '10minutemail.com', 'dispostable.com', 'maildrop.cc',
  'sharklasers.com', 'trashmail.com', 'fakeinbox.com', 'mailnesia.com',
  'temp-mail.org', 'getnada.com', 'emailondeck.com', 'tempail.com',
  'discard.email', 'mailcatch.com', 'mailslurp.com', 'mohmal.com',
  'burnermail.io', 'tmpmail.net', 'tempinbox.com', 'mytemp.email',
];

function isTempEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return TEMP_EMAIL_DOMAINS.some(d => d === domain);
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleGoogleCredential = async (credential: string) => {
    setServerError('');
    try {
      const data = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      setAuth(data.user, data.token, data.refreshToken);
      navigate('/');
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  useEffect(() => {
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response: any) => handleGoogleCredential(response.credential),
    });
    if (googleBtnRef.current) {
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 350,
        text: 'signup_with',
      });
    }
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'Full name is required';

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (isTempEmail(email)) {
      newErrors.email = 'Temporary/disposable email addresses are not allowed';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
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
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Enter your details below to start your wealth journey
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {serverError}
              </div>
            )}

            <div className="flex justify-center" ref={googleBtnRef} />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or sign up with email</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="John Doe"
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <p className="text-xs text-destructive font-medium">{errors.name}</p>}
            </div>
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
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
