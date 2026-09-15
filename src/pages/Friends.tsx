import { useState, useEffect } from 'react';
import { Search, UserPlus, MessageSquare, Loader2, Phone, Video, MoreVertical, ShieldAlert, Flag, UserMinus, Users, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { User } from '../types';
import { messagesAPI } from '../services/api/messages';
import { friendsAPI } from '../services/api/friends';
import { useChatStore } from '../stores/chatStore';
import { useFriendStore } from '../stores/friendStore';
import { useAuthStore } from '../stores/authStore';
import { usersAPI } from '../services/api/users';
import { Button } from '../components/common/Button';
import { BlockUserModal } from '../components/modals/BlockUserModal';
import { RemoveFriendModal } from '../components/modals/RemoveFriendModal';
import { ReportUserModal } from '../components/modals/ReportUserModal';
import { useToast } from '../components/ui/toast';
import { webRTCManager } from '../services/webrtc/WebRTCManager';
import { getSocket } from '../services/socket';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const Friends = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'friends' | 'find'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const {
    friends,
    setFriends,
    pendingRequests,
    sentRequests,
    blockedUsers,
    addSentRequest,
  } = useFriendStore();
  const { toast } = useToast();

  // Modals state
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);

  // Fetch initial friends list
  useEffect(() => {
    friendsAPI.getFriends().then((res) => {
      if (res.data) {
        setFriends(res.data);
      }
    }).catch(console.error);
  }, [setFriends]);

  // Search users query for "Find People" tab
  const { data: searchResults = [], isLoading: isSearching, isFetching } = useQuery({
    queryKey: ['searchUsers', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];
      const response = await usersAPI.searchUsers(debouncedSearch, 20);
      let list: User[] = [];
      if (Array.isArray(response.data)) {
        list = response.data;
      } else if (response.data && Array.isArray((response.data as any).items)) {
        list = (response.data as any).items;
      }
      return list.filter((u) => u.id !== currentUser?.id);
    },
    enabled: activeTab === 'find' && debouncedSearch.trim().length > 0,
    placeholderData: (previousData) => previousData,
  });

  const handleStartChat = async (userId: string) => {
    try {
      const response = await messagesAPI.startConversation(userId);
      if (response.data) {
        setActiveConversation(response.data.id);
        navigate(`/app/chat/${response.data.id}`);
      }
    } catch (error: any) {
      toast({
        title: 'Could not open conversation',
        description: error?.response?.data?.error || 'Failed to start chat',
        variant: 'destructive',
      });
    }
  };

  const handleSendFriendRequest = async (targetUser: User) => {
    try {
      setSendingRequestId(targetUser.id);
      const res = await friendsAPI.sendRequest(targetUser.id);
      if (res.data) {
        addSentRequest(res.data);
      }

      const socket = getSocket();
      if (socket) {
        socket.emit('friend:request', {
          targetUserId: targetUser.id,
          request: res.data,
        });
      }

      toast({
        title: 'Friend Request Sent',
        description: `Invitation sent to ${targetUser.username}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Request Failed',
        description: err?.response?.data?.error || err?.message || 'Could not send friend request',
        variant: 'destructive',
      });
    } finally {
      setSendingRequestId(null);
    }
  };

  const handleStartCall = (targetUserId: string, withVideo: boolean) => {
    webRTCManager.initiateCall(targetUserId, withVideo);
  };

  const getRelationshipStatus = (userId: string) => {
    if (friends.some((f) => f.id === userId)) return 'FRIENDS';
    if (pendingRequests.some((r) => r.senderId === userId)) return 'REQUEST_RECEIVED';
    if (sentRequests.some((r) => r.receiverId === userId)) return 'REQUEST_SENT';
    if (blockedUsers.some((b) => b.id === userId)) return 'BLOCKED';
    return 'NONE';
  };

  // Filter friends list by search query if in "friends" tab
  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-1 h-full w-full overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Friends</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Connect with people and start conversations.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-muted/60 p-1 border border-border/50 max-w-sm">
          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'friends'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>My Friends</span>
            <span className="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-0.2 text-[10px] font-bold">
              {friends.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('find')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'find'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Find People</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={activeTab === 'friends' ? 'Search your friends...' : 'Type username to find people...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-10 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all shadow-sm"
          />
          {isFetching && (
            <Loader2 className="absolute right-3.5 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Tab 1: My Friends */}
        {activeTab === 'friends' && (
          <div className="space-y-3">
            {filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border/70 text-muted-foreground text-center">
                <Users className="h-10 w-10 stroke-1 text-muted-foreground/50 mb-3" />
                <h3 className="text-sm font-semibold text-foreground">
                  No friends found
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {searchQuery ? 'Try another keyword' : 'Switch to the "Find People" tab to connect with other users.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors group relative"
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => handleStartChat(friend.id)}
                    >
                      <div className="relative shrink-0">
                        {friend.profilePicUrl ? (
                          <img
                            src={friend.profilePicUrl}
                            alt={friend.username}
                            className="w-11 h-11 rounded-full object-cover bg-muted ring-1 ring-border/50"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm ring-1 ring-border/50">
                            {friend.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                            onlineUsers.has(friend.id) ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{friend.username}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {onlineUsers.has(friend.id) ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartChat(friend.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Send Message"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartCall(friend.id, false)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Audio Call"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartCall(friend.id, true)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Video Call"
                      >
                        <Video className="h-4 w-4" />
                      </button>

                      {/* Dropdown Menu Toggle */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuUserId(openMenuUserId === friend.id ? null : friend.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {openMenuUserId === friend.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-popover shadow-lg py-1.5 z-20 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser({ id: friend.id, username: friend.username });
                                setRemoveModalOpen(true);
                                setOpenMenuUserId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted text-muted-foreground hover:text-destructive"
                            >
                              <UserMinus className="h-3.5 w-3.5" /> Remove Friend
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser({ id: friend.id, username: friend.username });
                                setBlockModalOpen(true);
                                setOpenMenuUserId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted text-muted-foreground hover:text-destructive"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" /> Block User
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser({ id: friend.id, username: friend.username });
                                setReportModalOpen(true);
                                setOpenMenuUserId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <Flag className="h-3.5 w-3.5" /> Report User
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Find People */}
        {activeTab === 'find' && (
          <div className="space-y-3">
            {!searchQuery.trim() ? (
              <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border/70 text-muted-foreground text-center">
                <Search className="h-10 w-10 stroke-1 text-muted-foreground/50 mb-3" />
                <h3 className="text-sm font-semibold text-foreground">Find friends on Chatly</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Type a username above to search and send friend requests.
                </p>
              </div>
            ) : isSearching && searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary" />
                <p className="text-sm">Searching users...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border/70 text-muted-foreground text-center">
                <p className="text-sm font-semibold text-foreground">No users found</p>
                <p className="text-xs mt-1">No accounts match "{searchQuery}"</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm">
                {searchResults.map((targetUser) => {
                  const status = getRelationshipStatus(targetUser.id);
                  const isPendingSend = sendingRequestId === targetUser.id;

                  return (
                    <div
                      key={targetUser.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {targetUser.profilePicUrl ? (
                          <img
                            src={targetUser.profilePicUrl}
                            alt={targetUser.username}
                            className="w-11 h-11 rounded-full object-cover bg-muted ring-1 ring-border/50"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm ring-1 ring-border/50">
                            {targetUser.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-foreground">{targetUser.username}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {targetUser.bio || 'Chatly member'}
                          </p>
                        </div>
                      </div>

                      {/* Dynamic Relationship Actions */}
                      <div>
                        {status === 'FRIENDS' ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStartChat(targetUser.id)}
                            className="h-8 px-3 text-xs gap-1.5"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Message
                          </Button>
                        ) : status === 'REQUEST_SENT' ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                            <Check className="h-3 w-3" /> Request Sent
                          </span>
                        ) : status === 'REQUEST_RECEIVED' ? (
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => navigate('/app/requests')}
                            className="h-8 px-3 text-xs"
                          >
                            Respond to Request
                          </Button>
                        ) : status === 'BLOCKED' ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
                            Blocked
                          </span>
                        ) : (
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => handleSendFriendRequest(targetUser)}
                            disabled={isPendingSend}
                            className="h-8 px-3 text-xs"
                          >
                            {isPendingSend ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="h-3.5 w-3.5 mr-1" /> Add Friend
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedUser && (
        <>
          <BlockUserModal
            open={blockModalOpen}
            onOpenChange={setBlockModalOpen}
            userId={selectedUser.id}
            username={selectedUser.username}
          />
          <RemoveFriendModal
            open={removeModalOpen}
            onOpenChange={setRemoveModalOpen}
            friendId={selectedUser.id}
            friendName={selectedUser.username}
          />
          <ReportUserModal
            open={reportModalOpen}
            onOpenChange={setReportModalOpen}
            userId={selectedUser.id}
            username={selectedUser.username}
          />
        </>
      )}
    </div>
  );
};