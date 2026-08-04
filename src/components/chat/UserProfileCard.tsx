import type{ User } from '../../types';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { formatRelativeTime, formatDate } from '../../utils/formatters';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import {
  MessageSquare,
  Share2,
  Clock,
  Calendar,
  Mail,
  Phone,
  Video,
  X,
  Contact,
  Ban,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { friendsAPI } from '../../services/api/friends';
import { useUIStore } from '@/stores/uiStore';

interface UserProfileCardProps {
  user: User;
  onMessage?: () => void;
}

export const UserProfileCard = ({
  user,
  onMessage,
}: UserProfileCardProps) => {
  const { setShowUserCard } = useUIStore()
  const { data: statusData } = useOnlineStatus(user.id);
  const { data: friendshipStatus } = useQuery({
    queryKey: ['friendship', user.id],
    queryFn: () => friendsAPI.getFriends(),
  });
  const isOnline = statusData?.data?.status === 'online';
  const isAway = statusData?.data?.status === 'away';
  const lastSeen = statusData?.data?.lastSeen
    ? formatRelativeTime(new Date(statusData.data.lastSeen))
    : 'Never';

  const memberSince = formatDate(new Date(user.createdAt));

  const handleBlockUser = () => {
    console.log('Block user:', user.username);
    // TODO: implement block user functionality
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {/* Close Button */}
        <div className="absolute">
        <Button
            size="icon"
            variant="ghost"
            onClick={()=>setShowUserCard(false)}
        >
          <X className="h-5 w-5" />
        </Button>
        </div>
        <CardHeader className="text-center pt-8">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Avatar
                user={user}
                src={user.profilePicUrl}
                alt={user.username}
                fallback={user.username[0]}
                size="xl"
              />
              <div
                className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-3 border-card ${
                  isOnline
                    ? 'bg-green-500'
                    : isAway
                    ? 'bg-yellow-500'
                    : 'bg-gray-500'
                }`}
              />
            </div>
          </div>

          {/* Username and Status */}
          <CardTitle className="text-2xl">{user.username}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Friendship status */}
          <div className="grid grid-cols-2 gap-2">
            {friendshipStatus?.success && (
              <Button variant="outline" size="sm" className="flex-1">
              <Contact className="h-4 w-4 mr-2" />
                  Friend Request
              </Button>
            )}

            {friendshipStatus?.success && (
              <Button variant="outline" size="sm" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
                  Message
              </Button>
            )}
          </div>
          
          {/* Bio */}
          {user.bio && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Bio</p>
              <p className="text-sm bg-muted rounded-lg p-3">{user.bio}</p>
            </div>
          )}

          {/* Status Info */}
          <div className="text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Online now</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Last seen {lastSeen}</span>
                </>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground break-all">{user.email}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Joined {memberSince}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onMessage}
              title='Call'
            >
              <Phone className="h-4 w-4 mr-2" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onMessage}
              title='Video'
            >
              <Video className="h-4 w-4 mr-2" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive"
              onClick={handleBlockUser}
              title='Block'
            >
              <Ban className="h-4 w-4 mr-2" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              title='Share'
            >
              <Share2 className="h-4 w-4 mr-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};