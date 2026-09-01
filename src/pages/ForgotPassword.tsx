import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { authAPI } from '@/services/api/auth'; 

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      await authAPI.forgotPassword(trimmedEmail);
      setStatus('success');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setStatus('error');
      setErrorMessage(error?.response?.data?.error || error?.response?.data?.message || 'Failed to send reset code. Please try again.');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 py-8 relative">
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="absolute top-6 left-6 group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background group-hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        </div>
        <span className="hidden sm:inline">Back to Login</span>
      </button>

      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center ring-1 ring-primary/20 shadow-sm">
            <KeyRound className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Forgot Password?</h1>
            <p className="text-sm text-muted-foreground max-w-[16rem] mx-auto">
              No worries, we'll send you reset instructions.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-sm">
          {status === 'success' ? (
            <div className="flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-foreground">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to <br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/reset-password', { state: { email } })}
                className="mt-4 w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Enter Reset Code
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {status === 'error' && (
                <div className="flex items-center gap-2 p-3 text-sm rounded-lg border border-destructive/20 bg-destructive/10 text-destructive animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    placeholder="name@example.com"
                    disabled={status === 'loading'}
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {status === 'loading' ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending link...</>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};