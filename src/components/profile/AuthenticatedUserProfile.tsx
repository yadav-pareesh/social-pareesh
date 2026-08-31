import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User as UserIcon,
  Shield,
  Bell,
  Trash2,
  Camera,
  LogOut,
  KeyRound,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';

import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { usersAPI } from '../../services/api/users';
import { useLogout } from '../../hooks/useAuth';
import { toast } from '../ui/toast';
import { Dialog, DialogContent } from '../common/Dialog';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
import type { User } from '@/types';
import { ChangePasswordPage } from './ChangePasswordCard';

interface AuthenticatedUserProfileProps {
  onNavigate?: (path: string) => void;
}

type TabType = 'profile' | 'security' | 'preferences';

export const AuthenticatedUserProfile = ({ onNavigate }: AuthenticatedUserProfileProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user: authUser, logout } = useAuthStore();
  const logoutMutation = useLogout();
  const { showChangePassword, setShowChangePassword } = useUIStore();

  const [activeTab, setActiveTab] = React.useState<TabType>('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // TanStack Query for user profile
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', authUser?.id],
    queryFn: () => (authUser?.id ? usersAPI.getUser(authUser.id) : Promise.reject('No user')),
    enabled: !!authUser?.id,
  });

  const profile = (userData?.data || authUser) as User | null;

  // Local edit state
  const [formData, setFormData] = React.useState({
    username: '',
    bio: '',
    profilePicUrl: '',
  });
  const [isDirty, setIsDirty] = React.useState(false);

  // Synchronize form when user data loads or changes
  React.useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        bio: profile.bio || '',
        profilePicUrl: profile.profilePicUrl || '',
      });
      setIsDirty(false);
    }
  }, [profile]);

  // Mutation for profile updates
  const updateMutation = useMutation({
    mutationFn: (data: Partial<User>) => usersAPI.updateProfile(authUser!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', authUser?.id] });
      setIsDirty(false);
      toast.add({
        title: 'Profile Updated',
        description: 'Your profile changes have been saved.',
        type: 'success',
      });
    },
    onError: (err: Error) => {
      toast.add({
        title: 'Update Failed',
        description: err.message || 'Could not update profile.',
        type: 'error',
      });
    },
  });

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || updateMutation.isPending) return;
    await updateMutation.mutateAsync(formData);
  };

  const handleLogout = () => {
    logout();
    if (onNavigate) onNavigate('/login');
    else navigate('/login');
  };

  if (isLoading && !profile) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-background p-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">Account profile not found</p>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-primary underline underline-offset-4"
        >
          Return to login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full w-full overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl p-6 sm:p-10 space-y-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </button>
          {/* Header Title */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your personal profile, privacy, and account security.
            </p>
          </div>
        </div>
        

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'profile'
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            Profile
            {activeTab === 'profile' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'security'
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="h-4 w-4" />
            Security & Access
            {activeTab === 'security' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'preferences'
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bell className="h-4 w-4" />
            Notifications
            {activeTab === 'preferences' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        {/* TAB 1: Profile Details */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            {/* Avatar & Identifiers */}
            <div className="flex items-center gap-5 p-4 rounded-xl border border-border bg-card/50">
              <div className="relative group shrink-0">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center">
                  {formData.profilePicUrl ? (
                    <img
                      src={formData.profilePicUrl}
                      alt={formData.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-muted-foreground">
                      {formData.username?.[0]?.toUpperCase() ?? 'U'}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{formData.username || 'Anonymous'}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="truncate">{profile.email}</span>
                  
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Bio / Status</label>
                <textarea
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell people about yourself..."
                  className="mt-1.5 w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Avatar URL</label>
                <input
                  type="url"
                  name="profilePicUrl"
                  value={formData.profilePicUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                />
              </div>
            </div>

            {/* Form Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={!isDirty}
                onClick={() => {
                  setFormData({
                    username: profile.username || '',
                    bio: profile.bio || '',
                    profilePicUrl: profile.profilePicUrl || '',
                  });
                  setIsDirty(false);
                }}
                className="h-9 px-4 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={!isDirty || updateMutation.isPending}
                className="flex items-center justify-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Security & Credentials */}
        {activeTab === 'security' && (
          <div className="space-y-6 max-w-2xl">
            <div className="divide-y divide-border rounded-xl border border-border bg-card/50 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">Change your sign-in credentials.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/change-password')}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Update
                </button>
              </div>

              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">Active Sessions</p>
                  <p className="text-xs text-muted-foreground">Log out from your current device session.</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-input bg-background hover:bg-destructive/10 hover:text-destructive text-xs font-medium transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Danger Area */}
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Delete Account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently remove your profile and message history.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Preferences / Notifications */}
        {activeTab === 'preferences' && (
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50">
              <div>
                <p className="text-sm font-medium">Direct Notifications</p>
                <p className="text-xs text-muted-foreground">Configure desktop, sound, and mention alerts.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/notification')}
                className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium transition-colors"
              >
                Configure
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Dialog */}
      {showChangePassword && (
        <Dialog open={true} onOpenChange={setShowChangePassword}>
          <DialogContent className="max-w-md">
            <ChangePasswordPage />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title="Delete Account"
          description="This action cannot be undone. All your chat history and account data will be permanently wiped."
          onConfirm={() => setShowDeleteConfirm(false)}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};