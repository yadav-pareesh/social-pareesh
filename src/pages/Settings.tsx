import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useFriendStore } from '../stores/friendStore';
import { friendsAPI } from '../services/api/friends';
import { usersAPI } from '../services/api/users';
import { uploadProfilePicture } from '../services/imagekit/uploadService';
import { Button } from '../components/common/Button';
import { Switch } from '../components/common/Switch';
import { useToast } from '../components/ui/toast';
import { DeleteAccountModal } from '../components/modals/DeleteAccountModal';
import { ChangePasswordPage } from '../components/profile/ChangePasswordCard';
import {
  User as UserIcon,
  Lock,
  Shield,
  UserX,
  Palette,
  Info,
  LogOut,
  Trash2,
  Camera,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'blocked' | 'appearance' | 'about'>('account');
  const { user, setUser, logout } = useAuthStore();
  const { isDarkMode, setDarkMode } = useUIStore();
  const { privacySettings, fetchPrivacySettings, updatePrivacySettings } = useSettingsStore();
  const { blockedUsers, setBlockedUsers, removeBlockedUser } = useFriendStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Profile Edit State
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePicUrl, setProfilePicUrl] = useState(user?.profilePicUrl || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [showMobileContent, setShowMobileContent] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingPic(true);
      setUploadProgress(0);

      const res = await uploadProfilePicture(file, user.id, (percent) => {
        setUploadProgress(percent);
      });

      setProfilePicUrl(res.url);

      // Auto-save to user profile
      const updateRes = await usersAPI.updateProfile(user.id, {
        profilePicUrl: res.url,
      });

      if (updateRes.data) {
        setUser({ ...user, ...updateRes.data });
      } else {
        setUser({ ...user, profilePicUrl: res.url });
      }

      toast({
        title: 'Profile Photo Updated',
        description: 'Your photo was uploaded to ImageKit and saved successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err?.message || 'Failed to upload photo to ImageKit',
        variant: 'destructive',
      });
    } finally {
      setUploadingPic(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    try {
      setSavingProfile(true);
      const updateRes = await usersAPI.updateProfile(user.id, {
        profilePicUrl: '',
      });
      setProfilePicUrl('');
      if (updateRes.data) {
        setUser({ ...user, profilePicUrl: '' });
      }
      toast({
        title: 'Photo Removed',
        description: 'Your profile photo has been removed.',
      });
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description: err?.message || 'Could not remove profile picture',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    fetchPrivacySettings();
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const res = await friendsAPI.getBlockedUsers();
      if (res.data) {
        setBlockedUsers(res.data);
      }
    } catch (err) {
      console.error('Failed to load blocked users', err);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setSavingProfile(true);
      const res = await usersAPI.updateProfile(user.id, {
        username: username.trim(),
        bio: bio.trim() || undefined,
        profilePicUrl: profilePicUrl || undefined,
      });

      if (res.data) {
        setUser({ ...user, ...res.data });
        toast({
          title: 'Profile Updated',
          description: 'Your profile details have been saved.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err?.response?.data?.error || err?.message || 'Could not update profile',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUnblock = async (blockedUserId: string, blockedUsername: string) => {
    try {
      setUnblockingId(blockedUserId);
      await friendsAPI.unblockUser(blockedUserId);
      removeBlockedUser(blockedUserId);
      toast({
        title: 'User Unblocked',
        description: `${blockedUsername} has been unblocked.`,
      });
    } catch (err: any) {
      toast({
        title: 'Failed to Unblock',
        description: err?.response?.data?.error || err?.message || 'Could not unblock user',
        variant: 'destructive',
      });
    } finally {
      setUnblockingId(null);
    }
  };

  const handlePrivacyChange = async (key: string, value: any) => {
    const success = await updatePrivacySettings({ [key]: value });
    if (success) {
      toast({
        title: 'Privacy Saved',
        description: 'Your privacy preferences have been updated.',
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-1 h-full w-full overflow-hidden bg-background text-foreground">
      {/* Settings Navigation Sidebar */}
      <div className={`${showMobileContent ? 'hidden sm:block' : 'block'} w-full sm:w-64 border-r border-border/70 p-4 space-y-2 shrink-0 bg-card/20`}>
        <h2 className="text-xl font-bold tracking-tight px-3 py-2">Settings</h2>
        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => { setActiveTab('account'); setShowPasswordChange(false); setShowMobileContent(true); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'account' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            <span>Account</span>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground/60 sm:hidden" />
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('privacy'); setShowPasswordChange(false); setShowMobileContent(true); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'privacy' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Privacy</span>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground/60 sm:hidden" />
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('blocked'); setShowPasswordChange(false); setShowMobileContent(true); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'blocked' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            }`}
          >
            <UserX className="h-4 w-4" />
            <span>Blocked Users</span>
            {blockedUsers.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-muted font-bold text-muted-foreground">
                {blockedUsers.length}
              </span>
            )}
            <ChevronRight className={`h-4 w-4 text-muted-foreground/60 sm:hidden ${blockedUsers.length > 0 ? 'ml-2' : 'ml-auto'}`} />
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('appearance'); setShowPasswordChange(false); setShowMobileContent(true); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'appearance' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground/60 sm:hidden" />
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('about'); setShowPasswordChange(false); setShowMobileContent(true); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'about' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            }`}
          >
            <Info className="h-4 w-4" />
            <span>About</span>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground/60 sm:hidden" />
          </button>
        </nav>

        <hr className="my-4 border-border/60" />

        <div className="space-y-1">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Settings Content Panel */}
      <div className={`${showMobileContent ? 'block' : 'hidden sm:block'} flex-1 h-full overflow-y-auto p-4 sm:p-10`}>
        <div className="max-w-xl mx-auto space-y-6 sm:space-y-8">
          {/* Mobile Back Header */}
          <div className="sm:hidden flex items-center justify-between pb-3 border-b border-border/60">
            <button
              type="button"
              onClick={() => {
                if (showPasswordChange) {
                  setShowPasswordChange(false);
                } else {
                  setShowMobileContent(false);
                }
              }}
              className="p-1 -ml-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Settings</span>
            </button>
            <span className="text-sm font-semibold capitalize text-foreground pr-1">
              {activeTab === 'blocked' ? 'Blocked Users' : activeTab}
            </span>
          </div>
          {/* TAB 1: ACCOUNT */}
          {activeTab === 'account' && (
            showPasswordChange ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 mb-2"
                >
                  ← Back to Account
                </button>
                <ChangePasswordPage />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Account Profile</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Update your public profile and account credentials.
                  </p>
                </div>

                {/* Profile Picture */}
                <div className="flex items-center gap-5 p-4 rounded-2xl border border-border bg-card/40">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Avatar Circle with Hover Overlay and Click Trigger */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPic}
                    title="Click to upload profile photo from system"
                    className="relative group shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform hover:scale-105"
                  >
                    {profilePicUrl ? (
                      <img
                        src={profilePicUrl}
                        alt={username}
                        className="w-16 h-16 rounded-full object-cover bg-muted ring-2 ring-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center ring-2 ring-border">
                        {username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}

                    {/* Camera / Loading Overlay */}
                    <div
                      className={`absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center transition-opacity ${
                        uploadingPic ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {uploadingPic ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="h-5 w-5 animate-spin mb-0.5" />
                          <span className="text-[9px] font-bold">{uploadProgress}%</span>
                        </div>
                      ) : (
                        <>
                          <Camera className="h-5 w-5 mb-0.5" />
                          <span className="text-[8px] font-semibold tracking-tight">Upload</span>
                        </>
                      )}
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{username || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPic}
                          className="h-8 text-xs gap-1.5"
                        >
                          {uploadingPic ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Uploading {uploadProgress}%</span>
                            </>
                          ) : (
                            <>
                              <Camera className="h-3.5 w-3.5" />
                              <span>Upload Photo</span>
                            </>
                          )}
                        </Button>

                        {profilePicUrl && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleRemovePhoto}
                            disabled={uploadingPic}
                            className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-2">
                      Upload directly from your system to ImageKit CDN (JPG, PNG, WEBP, GIF up to 10MB).
                    </p>

                    <input
                      type="url"
                      placeholder="Or paste image URL"
                      value={profilePicUrl}
                      onChange={(e) => setProfilePicUrl(e.target.value)}
                      className="mt-2 w-full text-xs rounded-md border border-input bg-background px-2.5 py-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Display Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Bio / Status Message
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell people about yourself..."
                      className="w-full rounded-xl border border-input bg-background p-3.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1.5" /> Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <hr className="border-border/60" />

                {/* Security Actions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold tracking-tight text-foreground">Security & Danger Zone</h4>
                  <div className="rounded-xl border border-border divide-y divide-border overflow-hidden bg-card/30">
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(true)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Change Password</p>
                          <p className="text-xs text-muted-foreground">Update your account password</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary">Edit →</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(true)}
                      className="w-full flex items-center justify-between p-4 hover:bg-destructive/10 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Delete Account</p>
                          <p className="text-xs text-muted-foreground">Permanently delete account and all data</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-destructive group-hover:underline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 2: PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Privacy Settings</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Control who can see your online presence and contact you.
                </p>
              </div>

              <div className="divide-y divide-border rounded-xl border border-border bg-card/40 overflow-hidden shadow-sm">
                {/* Last Seen */}
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Last Seen</p>
                    <p className="text-xs text-muted-foreground">Who can see when you were last online</p>
                  </div>
                  <select
                    value={privacySettings.lastSeen}
                    onChange={(e) => handlePrivacyChange('lastSeen', e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="friends">Friends Only</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                {/* Online Status */}
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Online Status</p>
                    <p className="text-xs text-muted-foreground">Display an active green dot when you're online</p>
                  </div>
                  <select
                    value={privacySettings.onlineStatus}
                    onChange={(e) => handlePrivacyChange('onlineStatus', e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="friends">Friends Only</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                {/* Read Receipts */}
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Read Receipts</p>
                    <p className="text-xs text-muted-foreground">Show blue double-checkmarks when messages are read</p>
                  </div>
                  <Switch
                    checked={privacySettings.readReceipts}
                    onCheckedChange={(val) => handlePrivacyChange('readReceipts', val)}
                  />
                </div>

                {/* Friend Requests */}
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Friend Requests</p>
                    <p className="text-xs text-muted-foreground">Who can send you friend invitations</p>
                  </div>
                  <select
                    value={privacySettings.friendRequests}
                    onChange={(e) => handlePrivacyChange('friendRequests', e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="friends_of_friends">Friends of Friends</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                {/* Calling Permissions */}
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Calls</p>
                    <p className="text-xs text-muted-foreground">Who can call you with Audio or Video</p>
                  </div>
                  <select
                    value={privacySettings.calls}
                    onChange={(e) => handlePrivacyChange('calls', e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="friends">Friends Only</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BLOCKED USERS */}
          {activeTab === 'blocked' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Blocked Users</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Contacts on your blocked list cannot send you messages or call you.
                </p>
              </div>

              {blockedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border text-center text-muted-foreground">
                  <UserX className="h-10 w-10 text-muted-foreground/50 stroke-1 mb-2" />
                  <p className="text-sm font-medium text-foreground">No blocked users</p>
                  <p className="text-xs mt-0.5 max-w-xs">
                    You have not blocked any contacts yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border rounded-xl border border-border bg-card/40 overflow-hidden shadow-sm">
                  {blockedUsers.map((bUser) => (
                    <div
                      key={bUser.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {bUser.profilePicUrl ? (
                          <img
                            src={bUser.profilePicUrl}
                            alt={bUser.username}
                            className="w-10 h-10 rounded-full object-cover bg-muted ring-1 ring-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted text-foreground flex items-center justify-center font-bold text-sm ring-1 ring-border">
                            {bUser.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-foreground">{bUser.username}</p>
                          <p className="text-xs text-muted-foreground">Blocked Contact</p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(bUser.id, bUser.username)}
                        disabled={unblockingId === bUser.id}
                        className="h-8 px-3 text-xs"
                      >
                        {unblockingId === bUser.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Unblock'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Appearance</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Customize the look and feel of the chat application.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDarkMode(false)}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                    !isDarkMode
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card/40 hover:border-muted-foreground/40 text-muted-foreground'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                    ☀
                  </div>
                  <p className="text-sm font-bold text-foreground">Light Mode</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Clean & bright</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDarkMode(true)}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                    isDarkMode
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card/40 hover:border-muted-foreground/40 text-muted-foreground'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                    🌙
                  </div>
                  <p className="text-sm font-bold text-foreground">Dark Mode</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Easy on the eyes</p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold tracking-tight">About Chatly</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Application and license information.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card/40 p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <span className="text-sm font-medium text-muted-foreground">Version</span>
                  <span className="text-sm font-semibold text-foreground">2.0.0 (Production)</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <span className="text-sm font-medium text-muted-foreground">Real-time Calling</span>
                  <span className="text-sm font-semibold text-emerald-500">WebRTC Direct P2P</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <span className="text-sm font-medium text-muted-foreground">CDN & Media</span>
                  <span className="text-sm font-semibold text-foreground">ImageKit.io Global CDN</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Security</span>
                  <span className="text-sm font-semibold text-foreground">Argon2 / Bcrypt + JWT Auth</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
      />
    </div>
  );
};
