import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Eye, EyeOff } from 'lucide-react';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username is too long'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(50, 'Password is too long'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const registerMutation = useRegister();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
      
      {/* Global Backend Error (Missing in original code) */}
      {registerMutation.isError && (
        <div 
          className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md mb-6 text-sm"
          role="alert"
          aria-live="polite"
        >
          {registerMutation.error?.message || 'An error occurred during registration.'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="username" className="text-sm font-medium mb-1.5 block text-foreground">
            Username
          </label>
          <Input
            id="username"
            type="text"
            placeholder="john_doe"
            disabled={registerMutation.isPending}
            {...register('username')}
          />
          {errors.username && (
            <p className="text-destructive text-sm mt-1.5">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium mb-1.5 block text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={registerMutation.isPending}
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
              disabled={registerMutation.isPending}
              {...register('password')}
              className="pr-10" // Prevent text from hiding behind the eye icon
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={registerMutation.isPending}
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
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Creating account...' : 'Register'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Login
        </Link>
      </p>
    </div>
  );
};