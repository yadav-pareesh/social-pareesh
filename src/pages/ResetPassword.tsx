import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Loader2, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { authAPI } from '@/services/api/auth';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Safely extract email passed from the ForgotPassword page
  const email = location.state?.email; 
  
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Protect the route: if they arrived here without an email, kick them back
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedOtp = otp.trim();
    const trimmedPassword = password.trim();

    if (trimmedOtp.length !== 6) {
      setStatus('error');
      setErrorMessage('Verification code must be 6 digits');
      return;
    }

    if (trimmedPassword !== confirmPassword) {
      setStatus('error');
      setErrorMessage('Passwords do not match');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      await authAPI.resetPassword({ email, otp: trimmedOtp, password: trimmedPassword });
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error?.response?.data?.error || 'Failed to reset password. The code may be expired.');
    }
  };

  if (!email) return null; // Prevent flicker before redirect

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4">
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center ring-1 ring-primary/20">
            <ShieldAlert className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Secure Reset</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Enter the 6-digit code sent to <br/><span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-sm">
          {status === 'success' ? (
            <div className="flex flex-col items-center text-center space-y-4 animate-in zoom-in-95">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Password Reset Successfully</h3>
                <p className="text-sm text-muted-foreground mt-1">You can now use your new password to log in.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-4 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {status === 'error' && (
                <div className="flex items-center gap-2 p-3 text-sm rounded-lg border border-destructive/20 bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium">Verification Code</label>
                  <input
                    id="otp"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      if (status === 'error') setStatus('idle');
                    }}
                    disabled={status === 'loading'}
                    placeholder="123456"
                    className="w-full text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-input bg-background py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <input
                      id="newPassword"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={status === 'loading'}
                      className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={status === 'loading'}
                      className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || otp.length !== 6 || !password || !confirmPassword}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? <><Loader2 className="inline mr-2 h-4 w-4 animate-spin" />Resetting...</> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};