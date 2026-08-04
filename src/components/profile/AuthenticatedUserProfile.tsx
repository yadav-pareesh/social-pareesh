import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../../services/api/users';
import { useLogout } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Navbar } from '../common/Navbar';
import {
  ProfileInformation,
  AccountInformation,
  QuickActions,
  Statistics,
  DangerZone,
} from './index';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
import type { User } from '@/types';
import { toast } from '../ui/toast';

interface AuthenticatedUserProfileProps {
  onNavigate?: (path: string) => void;
}

export const AuthenticatedUserProfile = ({
  onNavigate,
}: AuthenticatedUserProfileProps) => {
  const { user, logout } = useAuthStore();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    profilePicUrl: user?.profilePicUrl || '',
  });

  // Fetch current user profile
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', user?.id],
    queryFn: () =>
      user?.id
        ? usersAPI.getUser(user.id)
        : Promise.reject('No user'),
    enabled: !!user?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<User>) =>
      usersAPI.updateProfile(user!.id, data),
    onSuccess: (response) => {
      if (response.data) {
        queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
        setIsEditing(false);
        setFormData({
          username: response.data.username,
          bio: response.data.bio || '',
          profilePicUrl: response.data.profilePicUrl || '',
        });
        toast.add({
            title: "Success",
            description: "Profile updated successfully.",
            type: "success"
        })
      }
    },
    onError: (error) => {
      console.error('Update failed:', error);
      toast.add({
            title: "Error",
            description: `${error.message}`,
            type: "error"
        })
    },
  });

  const profile = (userData?.data || user) as User;

  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        username: profile.username,
        bio: profile.bio || '',
        profilePicUrl: profile.profilePicUrl || '',
      });
    }
  }, [profile, isEditing]);

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    await updateProfileMutation.mutateAsync(formData);
  };

  const handleCancel = () => {
    setFormData({
      username: profile.username,
      bio: profile.bio || '',
      profilePicUrl: profile.profilePicUrl || '',
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    onNavigate?.('/login');
  };

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion
    console.log('Account deletion not implemented yet');
    setShowDeleteConfirm(false);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleNotifications = () => {
    // TODO: implement notification logics here
    console.log('Navigate to notifications settings');
    toast.add({
            title: "Success",
            description: "Notification feature will come soon",
            type: "info"
        })
  };

  const handlePassword = () => {
    // TODO: implement password change logics here
    console.log('Navigate to password change');
    toast.add({
            title: "Success",
            description: "Reset password feature will come soon",
            type: "info"
        })
  };

  const handlePrivacy = () => {
    // TODO: implement privacy logic here
    console.log('Navigate to privacy settings');
    toast.add({
            title: "Success",
            description: "Privacy feature will come soon",
            type: "info"
        })
  };

  const handlePreferences = () => {
    // TODO: implement preferences logic here
    console.log('Navigate to preferences');
    toast.add({
            title: "Info",
            description: "Preference functionality will come soon",
            type: "info"
        })
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-6xl mx-auto p-4 py-8">
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <ConfirmDeleteModal
            title="Delete Account"
            description="This action cannot be undone. All your data will be permanently deleted."
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and personal information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <ProfileInformation
              profile={profile}
              isEditing={isEditing}
              formData={formData}
              isSaving={updateProfileMutation.isPending}
              onEdit={() => setIsEditing(true)}
              onCancel={handleCancel}
              onSave={handleSaveProfile}
              onInputChange={handleInputChange}
              onCopy={copyToClipboard}
              copiedField={copiedField}
            />

            {/* Account Information */}
            <AccountInformation profile={profile} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActions
              onNotifications={handleNotifications}
              onPassword={handlePassword}
              onPrivacy={handlePrivacy}
              onPreferences={handlePreferences}
            />

            {/* Statistics */}
            <Statistics
              friendsCount={0}
              messagesSentCount={0}
              groupsCount={0}
            />

            {/* Danger Zone */}
            <DangerZone
              onLogout={handleLogout}
              onDelete={() => setShowDeleteConfirm(true)}
              isLoggingOut={logoutMutation.isPending}
            />
          </div>
        </div>
      </main>
    </div>
  );
};