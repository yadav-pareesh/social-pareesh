import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card';
import { Edit2, Save, X, Upload, Copy, Check } from 'lucide-react';
import type { User } from '@/types';

interface ProfileInformationProps {
  profile: User;
  isEditing: boolean;
  formData: {
    username: string;
    bio: string;
    profilePicUrl: string;
  };
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
}

export const ProfileInformation = ({
  profile,
  isEditing,
  formData,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onInputChange,
  onCopy,
  copiedField,
}: ProfileInformationProps) => {
  const statusColor = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
  }[profile.status] || 'bg-gray-500';

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              {isEditing ? 'Edit your profile' : 'Your account details'}
            </CardDescription>
          </div>
          <Button
            variant={isEditing ? 'destructive' : 'default'}
            size="sm"
            onClick={() => (isEditing ? onCancel() : onEdit())}
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

      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar
              user={profile}
              src={profile.profilePicUrl}
              alt={profile.username}
              fallback={profile.username[0]}
              size="xl"
            />
            <div
              className={`absolute bottom-0 right-0 w-5 h-5 ${statusColor} rounded-full border-3 border-background`}
            />
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold">{profile.username}</h2>
            <Badge variant="default" className="mt-2">
              {profile.status === 'online'
                ? '🟢 Online'
                : profile.status === 'away'
                ? '🟡 Away'
                : '⚫ Offline'}
            </Badge>

            {isEditing && (
              <div className="mt-4">
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Change Avatar
                </Button>
              </div>
            )}
          </div>
        </div>

        <hr />

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            {isEditing ? (
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={onInputChange}
                className="mt-1"
              />
            ) : (
              <div className="flex items-center gap-2 mt-1 p-2 bg-muted rounded">
                <span>{profile.username}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopy(profile.username, 'username')}
                >
                  {copiedField === 'username' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <div className="flex items-center gap-2 mt-1 p-2 bg-muted rounded">
              <span className="text-sm">{profile.email}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCopy(profile.email, 'email')}
              >
                {copiedField === 'email' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            {isEditing ? (
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={onInputChange}
                placeholder="Tell us about yourself..."
                className="mt-1 resize-none"
                rows={4}
              />
            ) : (
              <div className="mt-1 p-3 bg-muted rounded text-sm">
                {profile.bio || (
                  <span className="text-muted-foreground italic">
                    No bio added yet
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Profile Picture URL */}
          <div>
            <label htmlFor="profilePicUrl" className="text-sm font-medium">
              Profile Picture URL
            </label>
            {isEditing ? (
              <Input
                id="profilePicUrl"
                name="profilePicUrl"
                type="url"
                value={formData.profilePicUrl}
                onChange={onInputChange}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1"
              />
            ) : (
              <div className="mt-1 p-3 bg-muted rounded text-sm break-all">
                {profile.profilePicUrl || (
                  <span className="text-muted-foreground italic">
                    No custom profile picture
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};