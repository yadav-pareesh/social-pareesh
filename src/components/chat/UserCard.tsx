import type{ User } from '../../types';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { formatRelativeTime } from '../../utils/formatters';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import {
  Phone,
  Video,
  Info,
  MoreVertical,
  Clock,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../common/DropdownMenu';
import { useUIStore } from '../../stores/uiStore';

interface UserCardProps {
  user: User;
  isExpanded?: boolean;
  onCall?: () => void;
  onVideoCall?: () => void;
}

export const UserCard = ({
  user,
  isExpanded = true,
  onCall,
  onVideoCall
}: UserCardProps) => {
  const { data: statusData } = useOnlineStatus(user.id);
  const {showUserCard, setShowUserCard} = useUIStore();

  const isOnline = statusData?.data?.status === 'online';
  const isAway = statusData?.data?.status === 'away';
  const lastSeen = statusData?.data?.lastSeen
    ? formatRelativeTime(new Date(statusData.data.lastSeen))
    : 'Never';

  const statusColor = isOnline ? 'bg-green-500' : isAway ? 'bg-yellow-500' : 'bg-gray-500';
  const statusLabel = isOnline ? 'Online' : isAway ? 'Away' : 'Offline';

  const handleClose = () => {
    setShowUserCard(false);
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      {/* Header with Avatar and Status */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              user={user}
              alt={user.username}
              fallback={user.username[0]}
              size="lg"
            />
            <div
              className={`absolute bottom-0 right-0 w-4 h-4 ${statusColor} rounded-full border-2 border-card`}
            />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-lg">{user.username}</h3>
            <div className="items-center gap-2">
              <Badge variant={isOnline ? 'default' : 'secondary'}>
                {statusLabel}
              </Badge>
              {!isOnline && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lastSeen}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu Button */}
        <DropdownMenu
          trigger={
            <Button size="icon" variant="ghost">
              <MoreVertical className="h-5 w-5" />
            </Button>
          }
        >
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleClose}>
                <div className='flex align-center items-center'>
                    <X className={`h-4 w-4 mr-2`} />
                    <span>Close</span>
                </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bio Section */}
      {user.bio && (
        <div className="bg-muted rounded-lg p-3">
          <p className="text-sm text-foreground">{user.bio}</p>
        </div>
      )}

      {/* Email and Member Since */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Email:</span>
          <span className="text-foreground break-all">{user.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Member Since:</span>
          <span className="text-foreground">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onCall}
          disabled={!isOnline}
        >
          <Phone className="h-4 w-4 mr-2" />
          Call
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onVideoCall}
          disabled={!isOnline}
        >
          <Video className="h-4 w-4 mr-2" />
          Video
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowUserCard(!showUserCard)}
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};