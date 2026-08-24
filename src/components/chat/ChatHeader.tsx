import type { User } from '../../types';
import { useChatStore } from '../../stores/chatStore';
import { Phone, Video, Info, Search, Bell, MoreVertical, Ban, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';
import { formatLastSeen } from '../../utils/formatters';
import { Avatar } from '../common/Avatar';
import { useMemo, useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '../common/DropdownMenu';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useWebRTC } from '@/hooks/useWebRTC'; // 1. Import the WebRTC hook

interface ChatHeaderProps {
  user: User;
  conversationId: string;
}

export const ChatHeader = ({ user, conversationId }: ChatHeaderProps) => {
  const isOnline = useOnlineStatus(user.id);
  const { initiateCall } = useWebRTC(); // 2. Extract the calling function
  
  const { setShowUserCard } = useUIStore();
  const { setActiveConversation } = useChatStore();
  const [isMuted, setIsMuted] = useState(false);

  const typingUsers = useMemo(
    () => useChatStore.getState().getTypingUsers(conversationId),
    [conversationId]
  );

  const isTyping = typingUsers.includes(user.id);
  
  const lastSeenText = user.lastSeen 
    ? formatLastSeen(user.lastSeen) 
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
    setIsMuted(!isMuted);
  };

  // 3. Wire up the Voice Call Button
  const handleCall = async () => {
    try {
      // initiateCall(targetUserId, withVideo)
      await initiateCall(user.id, false);
    } catch (error) {
      console.error('Failed to start voice call:', error);
      alert('Could not access microphone. Please check your browser permissions.');
    }
  };
  
  // 4. Wire up the Video Call Button
  const handleVideoCall = async () => {
    try {
      await initiateCall(user.id, true);
    } catch (error) {
      console.error('Failed to start video call:', error);
      alert('Could not access camera/microphone. Please check your browser permissions.');
    }
  };

  const handleBlock = () => {
    console.log('Blocked user:', user.username);
  };

  return (
    <div className="flex w-full items-center justify-between h-14 p-4 border-b bg-background">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveConversation(null)}
          aria-label="Back to conversations"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div onClick={() => setShowUserCard(true)} className="flex cursor-pointer items-center gap-3">
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
      </div>
      
      <div className="flex gap-2 align-center items-center">
        <Button 
          onClick={handleCall} 
          size="icon" 
          variant="ghost" 
          aria-label="Voice call"
          disabled={!isOnline} // Optional: Prevent calling offline users
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button 
          onClick={handleVideoCall} 
          size="icon" 
          variant="ghost" 
          aria-label="Video call"
          disabled={!isOnline} // Optional: Prevent calling offline users
        >
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