import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../services/api/users';
import { Navbar } from '../components/common/Navbar';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Textarea } from '../components/common/Textarea';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/common/Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/common/Card';
import {
  Settings,
  Bell,
  Lock,
  LogOut,
  Trash2,
  Edit2,
  Save,
  X,
  User,
  Shield,
  Zap,
} from 'lucide-react';
import { useLogout } from '../hooks/useAuth';

export const ProfileTabs = () => {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuthStore();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    bio: currentUser?.bio || '',
    profilePicUrl: currentUser?.profilePicUrl || '',
  });

  const { data: userData } = useQuery({
    queryKey: ['user', currentUser?.id],
    queryFn: () =>
      currentUser?.id
        ? usersAPI.getUser(currentUser.id)
        : Promise.reject('No user'),
    enabled: !!currentUser?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => usersAPI.updateProfile(currentUser!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', currentUser?.id] });
      setIsEditing(false);
    },
  });

  const profile = userData?.data || currentUser;

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto p-4 py-8">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-8 pb-6 border-b">
          <Avatar
            user={profile}
            src={profile.profilePicUrl}
            alt={profile.username}
            fallback={profile.username[0]}
            size="xl"
          />
          <div>
            <h1 className="text-3xl font-bold">{profile.username}</h1>
            <p className="text-muted-foreground">{profile.email}</p>
            <Badge className="mt-2">
              {profile.status === 'online' ? '🟢 Online' : '⚫ Offline'}
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => (isEditing ? setIsEditing(false) : setIsEditing(true))}
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Username</label>
                  {isEditing ? (
                    <Input
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-muted rounded">{profile.username}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="mt-1 p-2 bg-muted rounded text-sm">{profile.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Bio</label>
                  {isEditing ? (
                    <Textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself..."
                      className="mt-1"
                      rows={4}
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-muted rounded text-sm">
                      {profile.bio || 'No bio added'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Profile Picture URL</label>
                  {isEditing ? (
                    <Input
                      name="profilePicUrl"
                      type="url"
                      value={formData.profilePicUrl}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-muted rounded text-sm break-all">
                      {profile.profilePicUrl || 'No custom picture'}
                    </p>
                  )}
                </div>

                {isEditing && (
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Two-Factor Authentication
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="h-4 w-4 mr-2" />
                  Active Sessions
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <span>Message Notifications</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <span>Friend Request Notifications</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <span>Email Notifications</span>
                  <input type="checkbox" className="w-4 h-4" />
                </div>
                <Button className="w-full">Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};