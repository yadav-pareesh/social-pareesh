import { useRef, useEffect } from 'react';
import type { User } from '../../types';
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
  const { setShowUserCard } = useUIStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 1. PERFECTLY TYPED: Just directly assign the boolean from our new hook!
  const isOnline = useOnlineStatus(user.id);
  
  const { data: friendshipStatus } = useQuery({
    queryKey: ['friendship', user.id],
    queryFn: () => friendsAPI.getFriends(),
  });
  
  // 2. Map lastSeen directly from the user object
  const lastSeen = user.lastSeen
    ? formatRelativeTime(new Date(user.lastSeen))
    : 'Never';

  const memberSince = formatDate(new Date(user.createdAt));

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        cardRef.current &&
        !cardRef.current.contains(event.target as Node)
      ) {
        setShowUserCard(false);
      }
    };

    // Handle escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserCard(false);
      }
    };

    // Delay adding listener to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }, 0);

    // Cleanup
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [setShowUserCard]);

  const handleBlockUser = () => {
    console.log('Block user:', user.username);
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/80 flex items-center justify-center p-4"
    >
      {/* Wrapper div with ref instead of Card with ref */}
      <div 
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md"
      >
        <Card className="w-full relative">
          {/* Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowUserCard(false)}
              aria-label="Close profile card"
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
                    isOnline ? 'bg-green-500' : 'bg-gray-500'
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
                <Button disabled={true} variant="outline" size="sm" className="flex-1">
                  <Contact className="h-4 w-4 mr-2" />
                  Friend Request
                </Button>
              )}

              {friendshipStatus?.success && (
                <Button 
                  onClick={() => setShowUserCard(false)} 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Bio</p>
                <p className="text-sm bg-muted dark:bg-gray-800 rounded-lg p-3">
                  {user.bio}
                </p>
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
                <span className="text-muted-foreground break-all">
                  {user.email}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Joined {memberSince}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onMessage}
                title="Call"
                aria-label="Call user"
              >
                <Phone className="h-4 w-4 mr-2" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onMessage}
                title="Video"
                aria-label="Video call user"
              >
                <Video className="h-4 w-4 mr-2" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive"
                onClick={handleBlockUser}
                title="Block"
                aria-label="Block user"
              >
                <Ban className="h-4 w-4 mr-2" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                title="Share"
                aria-label="Share profile"
              >
                <Share2 className="h-4 w-4 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};