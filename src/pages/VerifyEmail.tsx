import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, Loader2 } from 'lucide-react';
import { authAPI } from '@/services/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

export const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email')?.trim().toLowerCase() || '';
  const { setUser, setToken, setRefreshToken } = useAuthStore();
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<'idle' | 'resending' | 'verifying'>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otp.length !== 6 || !email) {
      setError('Enter the 6-digit code sent to your email.');
      return;
    }

    setStatus('verifying');
    setError('');
    try {
      const response = await authAPI.verifyRegistration(email, otp);
      const session = response.data;
      if (!session?.token || !session.user) throw new Error('Verification response was invalid.');
      setToken(session.token);
      setRefreshToken(session.refreshToken ?? null);
      setUser(session.user);
      navigate('/chat');
    } catch (verificationError: any) {
      setError(verificationError?.response?.data?.error || verificationError?.message || 'Invalid or expired code.');
      setStatus('idle');
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setStatus('resending');
    setError('');
    setMessage('');
    try {
      await authAPI.resendVerification(email);
      setMessage('If this account is awaiting verification, a new code has been sent.');
    } catch (resendError: any) {
      setError(resendError?.response?.data?.error || 'Unable to resend the code. Please try again.');
    } finally {
      setStatus('idle');
    }
  };

  if (!email) {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-4">
        <p className="text-sm text-destructive">A verification email address is required.</p>
        <Link to="/register" className="text-primary hover:underline">Return to registration</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
          <MailCheck className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Verify your email</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter the 6-digit code sent to <strong>{email}</strong></p>
        </div>
      </div>

      {error && <div role="alert" className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm">{error}</div>}
      {message && <div role="status" className="bg-primary/10 border border-primary/20 p-3 rounded-md text-sm">{message}</div>}

      <form onSubmit={handleVerify} className="space-y-4">
        <Input
          aria-label="Verification code"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
          disabled={status !== 'idle'}
          className="text-center text-2xl tracking-[0.5em] font-mono h-14"
        />
        <Button type="submit" className="w-full" disabled={status !== 'idle' || otp.length !== 6}>
          {status === 'verifying' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Verify Email
        </Button>
      </form>

      <button type="button" onClick={handleResend} disabled={status !== 'idle'} className="w-full text-sm text-primary hover:underline disabled:opacity-50">
        {status === 'resending' ? 'Sending a new code...' : 'Resend verification code'}
      </button>
      <p className="text-center text-sm text-muted-foreground"><Link to="/login" className="text-primary hover:underline">Back to login</Link></p>
    </div>
  );
};