import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  Circle,
  KeyRound,
} from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { usersAPI } from '@/services/api/users';
import { toast } from '../ui/toast';
import { SPECIAL_CHAR_PASS_FILTER } from '@/constants';

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .min(6, 'Password must be at least 6 characters'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
  });

  const newPassword = watch('newPassword') || '';

  // Password criteria verification
  const rules = React.useMemo(
    () => [
      { label: 'At least 6 characters', valid: newPassword.length >= 6 },
      { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(newPassword) },
      { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(newPassword) },
      { label: 'One numeric digit (0-9)', valid: /[0-9]/.test(newPassword) },
      {
        label: 'One special symbol (!@#$%^&*)',
        valid: SPECIAL_CHAR_PASS_FILTER.test(newPassword),
      },
    ],
    [newPassword]
  );

  const passedRulesCount = rules.filter((r) => r.valid).length;

  const strengthConfig = React.useMemo(() => {
    if (!newPassword) return { label: 'Empty', color: 'bg-muted', pct: 0 };
    if (passedRulesCount <= 2) return { label: 'Weak', color: 'bg-destructive', pct: 25 };
    if (passedRulesCount === 3) return { label: 'Fair', color: 'bg-amber-500', pct: 50 };
    if (passedRulesCount === 4) return { label: 'Strong', color: 'bg-primary', pct: 75 };
    return { label: 'Very Strong', color: 'bg-emerald-500', pct: 100 };
  }, [newPassword, passedRulesCount]);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordFormData) => {
      return usersAPI.changePassword(user?.id as string, data.currentPassword, data.newPassword);
    },
    onSuccess: () => {
      reset();
      toast.add({
        title: 'Password Updated',
        description: 'Your sign-in credentials have been changed successfully.',
        type: 'success',
      });
      navigate(-1);
    },
    onError: (error: Error) => {
      toast.add({
        title: 'Update Failed',
        description: error.message || 'Could not change password.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="flex flex-1 h-full w-full overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl p-6 sm:p-10 space-y-8">
        {/* Header with Inline Back Action */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Change Password</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Choose a strong, unique password to secure your chat account.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 max-w-2xl">
          <div className="rounded-xl border border-border bg-card/40 p-4 sm:p-3 space-y-4 shadow-sm">
            {/* Current Password Field */}
            <div className="space-y-1">
              <label
                htmlFor="currentPassword"
                className="text-xs font-medium text-muted-foreground"
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  {...register('currentPassword')}
                  className={`h-10 w-full rounded-md border bg-background pl-3 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-all ${
                    errors.currentPassword ? 'border-destructive' : 'border-input'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="border-t border-border/60 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* New Password Field */}
                <div className="space-y-1.5 min-w-0">
                  <label
                    htmlFor="newPassword"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      {...register('newPassword')}
                      className={`h-10 w-full rounded-md border bg-background pl-3 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-all ${
                        errors.newPassword ? 'border-destructive' : 'border-input'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-xs text-destructive mt-1 font-medium">
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1.5 min-w-0">
                  <label
                    htmlFor="confirmPassword"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      {...register('confirmPassword')}
                      className={`h-10 w-full rounded-md border bg-background pl-3 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-all ${
                        errors.confirmPassword ? 'border-destructive' : 'border-input'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive mt-1 font-medium">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

            </div>
           
            {/* Password Strength Meter */}
              {newPassword && (
                <div className="space-y-2 rounded-lg bg-muted/40 p-3 border border-border/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength</span>
                    <span className="font-medium">{strengthConfig.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strengthConfig.color} transition-all duration-300`}
                      style={{ width: `${strengthConfig.pct}%` }}
                    />
                  </div>
                </div>
              )}
{/* Validation Checklist Card */}
          <div className=" space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Password Requirements</span>
            </div>
            <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              {rules.map((rule, idx) => (
                <li
                  key={idx}
                  className={`flex items-center gap-2 transition-colors ${
                    rule.valid ? 'text-emerald-500 font-medium' : ''
                  }`}
                >
                  {rule.valid ? (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                  )}
                  <span>{rule.label}</span>
                </li>
              ))}
            </ul>
          </div>


          </div>

          
          {/* Action Triggers */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-9 px-4 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || changePasswordMutation.isPending}
              className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {changePasswordMutation.isPending ? (
                'Updating...'
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};