import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const { 
    register,
    watch,
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const enteredEmail = watch('email');
  const loginErrorMessage = loginMutation.error?.message || 'An error occurred during login.';
  const requiresEmailVerification = loginErrorMessage.toLowerCase().includes('verify your email');

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      
      {/* Global Backend Error */}
      {loginMutation.isError && (
        <div 
          className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md mb-6 text-sm"
          role="alert"
          aria-live="polite"
        >
          {loginErrorMessage}
          {requiresEmailVerification && enteredEmail && (
            <Link
              to={`/verify-email?email=${encodeURIComponent(enteredEmail.trim().toLowerCase())}`}
              className="block mt-2 font-medium underline underline-offset-2"
            >
              Verify email or resend code
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium mb-1.5 block text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={loginMutation.isPending}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-destructive text-sm mt-1.5">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium mb-1.5 block text-foreground">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              disabled={loginMutation.isPending}
              {...register('password')}
              className="pr-10" // Prevent text from hiding behind the eye icon
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loginMutation.isPending}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm disabled:opacity-50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-sm mt-1.5">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Logging in...' : 'Login'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Register
        </Link>
      </p>
      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link to="/forgot-password" className="text-primary hover:underline font-medium">
          Forgot Password
        </Link>
      </p>
    </div>
  );
};