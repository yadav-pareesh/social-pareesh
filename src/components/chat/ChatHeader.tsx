import type { User } from '../../types';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useChatStore } from '../../stores/chatStore';
import { Phone, Video, Info, Search, Bell, MoreVertical, Ban } from 'lucide-react';
import { Button } from '../common/Button';
import { formatLastSeen } from '../../utils/formatters';
import { Avatar } from '../common/Avatar';
import { useMemo, useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '../common/DropdownMenu';

interface ChatHeaderProps {
  user: User;
  conversationId: string;
}

export const ChatHeader = ({ user, conversationId }: ChatHeaderProps) => {
  const { data: statusData } = useOnlineStatus(user.id);
  const { setShowUserCard } = useUIStore();
   const [isMuted, setIsMuted] = useState(false);

  const isOnlineFromStore = useChatStore((state) => state.isUserOnline(user.id));

  const typingUsers = useMemo(
    () => useChatStore.getState().getTypingUsers(conversationId),
    [conversationId]
  );

  const isTyping = typingUsers.includes(user.id);
  const isOnline = statusData?.data?.status === 'online' || isOnlineFromStore;
  const lastSeenText = statusData?.data?.lastSeen
    ? formatLastSeen(statusData.data.lastSeen)
    : 'recently';

  const statusText = isTyping
    ? 'typing...'
    : isOnline
      ? 'Online'
      : lastSeenText;

  const handleViewProfile = () => {
    setShowUserCard(true);
  };

  const handleSearchConversation = () => {
    console.log('Search conversation for:', user.username);
    // TODO: Implement search functionality
  };

  const handleMuteNotifications = () => {
     // TODO: Implement mute/unmute notification functionality
     setIsMuted(!isMuted)
    console.log(isMuted ? 'Unmuted' : 'Muted', 'notifications for:', user.username);
  };

  const handleCall = () => {
    console.log('Call initiated with', user.username);
    // TODO: Implement call functionality
  };
  
  const handleVideoCall = () => {
    console.log('Video call initiated with', user.username);
    // TODO: Implement video call functionality
  };

  const handleBlock = () => {
    // TODO: Implement the user block/unblock functinality
    console.log('Blocked user:', user.username);
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div onClick={()=>setShowUserCard(true)} className="flex cursor-pointer items-center gap-3">
        <Avatar 
          user={user} 
          size="md" 
          showOnlineIndicator={true} 
        />

        <div className="min-w-0">
          <h3 className="font-semibold truncate">{user.username}</h3>
          <p className="text-xs text-muted-foreground">
            {isTyping ? (
              <span className="italic text-muted-foreground">typing...</span>
            ) : isOnline ? (
              <span className="text-emerald-500 font-medium">{statusText}</span>
            ) : (
              statusText
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-2 align-center items-center">
        <Button onClick={handleCall} size="icon" variant="ghost" aria-label="Voice call">
          <Phone className="h-5 w-5" />
        </Button>
        <Button onClick={handleVideoCall} size="icon" variant="ghost" aria-label="Video call">
          <Video className="h-5 w-5" />
        </Button>

        {/* Menu Button */}
          <div>
            <DropdownMenu trigger={<MoreVertical className="h-5 w-5" />}>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleViewProfile}>
                    <div className='flex align-center items-center'>
                        <Info className="h-4 w-4 mr-2" />
                        <span>View Profile</span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSearchConversation}>
                  <div className='flex align-center items-center'>
                    <Search className="h-4 w-4 mr-2" />
                    <span>Search Conversation</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMuteNotifications}>
                    <div className='flex align-center items-center'>
                        <Bell className={`h-4 w-4 mr-2 ${isMuted ? 'opacity-50' : ''}`} />
                        <span>{isMuted ? 'Unmute' : 'Mute'} Notifications</span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBlock} >
                  <div className='flex align-center items-center text-destructive'>
                    <Ban className="h-4 w-4 mr-2" />
                    Block
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
      </div>
    </div>
  );
};