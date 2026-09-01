import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '../../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { authAPI } from '@/services/api/auth';
import { useAuthStore } from '../../stores/authStore';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username is too long'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(50, 'Password is too long'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const { setUser, setToken, setRefreshToken } = useAuthStore();

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        setRegisteredEmail(data.email);
        setStep('verify');
      }
    });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setVerifyError('OTP must be exactly 6 digits');
      return;
    }

    setIsVerifying(true);
    setVerifyError('');

    try {
      const response = await authAPI.verifyRegistration(registeredEmail, otp);
      const session = response.data;

      if (!session?.token || !session?.user) {
        throw new Error('Verification response was invalid.');
      }

      setToken(session.token);
      setRefreshToken(session.refreshToken ?? null);
      setUser(session.user);
      navigate('/chat');
    } catch (error: any) {
      setVerifyError(error?.response?.data?.error || error?.message || 'Invalid or expired code.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <MailCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Check your email</h2>
            <p className="text-sm text-muted-foreground mt-1">
              We sent a 6-digit code to <strong>{registeredEmail}</strong>
            </p>
          </div>
        </div>

        {verifyError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm">
            {verifyError}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, '')); // Only allow numbers
              if (verifyError) setVerifyError('');
            }}
            className="text-center text-2xl tracking-[0.5em] font-mono h-14"
            disabled={isVerifying}
          />
          <Button type="submit" className="w-full" disabled={isVerifying || otp.length !== 6}>
            {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Verify Email
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
      
      {registerMutation.isError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md mb-6 text-sm" role="alert">
          {registerMutation.error?.message || 'An error occurred during registration.'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username and Email Inputs remain exactly the same */}
        <div>
          <label htmlFor="username" className="text-sm font-medium mb-1.5 block">Username</label>
          <Input id="username" placeholder="john_doe" disabled={registerMutation.isPending} {...register('username')} />
          {errors.username && <p className="text-destructive text-sm mt-1.5">{errors.username.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium mb-1.5 block">Email</label>
          <Input id="email" type="email" placeholder="you@example.com" disabled={registerMutation.isPending} {...register('email')} />
          {errors.email && <p className="text-destructive text-sm mt-1.5">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium mb-1.5 block">Password</label>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" disabled={registerMutation.isPending} {...register('password')} className="pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={registerMutation.isPending} className="absolute right-3 top-2.5 text-muted-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-sm mt-1.5">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Creating account...' : 'Register'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Login</Link>
      </p>
    </div>
  );
};