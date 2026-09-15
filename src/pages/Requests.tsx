import { useEffect, useState } from 'react';
import { useFriendStore } from '../stores/friendStore';
import { friendsAPI } from '../services/api/friends';
import { Button } from '../components/common/Button';
import { UserCheck, UserX, Clock, Inbox, Send, Loader2 } from 'lucide-react';
import { useToast } from '../components/ui/toast';
import { getSocket } from '../services/socket';

export const Requests = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const {
    pendingRequests,
    sentRequests,
    setPendingRequests,
    setSentRequests,
    removePendingRequest,
    removeSentRequest,
    addFriend,
    isLoading,
    setLoading,
  } = useFriendStore();
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [pendingRes, sentRes] = await Promise.all([
        friendsAPI.getPendingRequests(),
        friendsAPI.getSentRequests(),
      ]);

      if (pendingRes.data) {
        setPendingRequests(pendingRes.data);
      }
      if (sentRes.data) {
        setSentRequests(sentRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (requestId: string, sender: any) => {
    try {
      setActionLoading(requestId);
      const res = await friendsAPI.acceptRequest(requestId);
      removePendingRequest(requestId);
      if (sender) {
        addFriend(sender);
      }

      const socket = getSocket();
      if (socket && sender?.id) {
        socket.emit('friend:accept', {
          targetUserId: sender.id,
          request: res.data,
        });
      }

      toast({
        title: 'Friend Request Accepted',
        description: `You are now friends with ${sender?.username || 'user'}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Failed to Accept',
        description: err?.response?.data?.error || err?.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string, senderId?: string) => {
    try {
      setActionLoading(requestId);
      await friendsAPI.rejectRequest(requestId);
      removePendingRequest(requestId);

      const socket = getSocket();
      if (socket && senderId) {
        socket.emit('friend:reject', {
          targetUserId: senderId,
          requestId,
        });
      }

      toast({
        title: 'Request Declined',
        description: 'The friend request has been rejected.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to Reject',
        description: err?.response?.data?.error || err?.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (requestId: string, receiverId?: string) => {
    try {
      setActionLoading(requestId);
      await friendsAPI.cancelRequest(requestId);
      removeSentRequest(requestId);

      const socket = getSocket();
      if (socket && receiverId) {
        socket.emit('friend:cancel', {
          targetUserId: receiverId,
          requestId,
        });
      }

      toast({
        title: 'Request Cancelled',
        description: 'Friend request was cancelled.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to Cancel',
        description: err?.response?.data?.error || err?.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-1 h-full w-full overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Friend Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your incoming and outgoing friend invitations.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-muted/60 p-1 border border-border/50 max-w-sm">
          <button
            type="button"
            onClick={() => setActiveTab('received')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'received'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span>Received</span>
            {pendingRequests.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.2 text-[10px] font-bold text-primary-foreground">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'sent'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Sent</span>
            {sentRequests.length > 0 && (
              <span className="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-0.2 text-[10px] font-medium text-foreground">
                {sentRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Requests List */}
        <div className="space-y-3">
          {isLoading && pendingRequests.length === 0 && sentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary" />
              <p className="text-sm">Loading invitations...</p>
            </div>
          ) : activeTab === 'received' ? (
            pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border/70 text-muted-foreground text-center">
                <Inbox className="h-10 w-10 stroke-1 text-muted-foreground/50 mb-3" />
                <h3 className="text-sm font-semibold text-foreground">No pending friend requests</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  When other people send you a friend invitation, it will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm">
                {pendingRequests.map((req) => {
                  const sender = req.sender;
                  const isProcessing = actionLoading === req.id;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {sender?.profilePicUrl ? (
                          <img
                            src={sender.profilePicUrl}
                            alt={sender.username}
                            className="w-11 h-11 rounded-full object-cover bg-muted ring-1 ring-border/50"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm ring-1 ring-border/50">
                            {sender?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {sender?.username || 'User'}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {sender?.bio || 'Wants to connect with you'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(req.id, sender?.id)}
                          disabled={isProcessing}
                          className="h-8 px-3 text-xs"
                        >
                          <UserX className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          Decline
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => handleAccept(req.id, sender)}
                          disabled={isProcessing}
                          className="h-8 px-3 text-xs"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5 mr-1" />
                              Accept
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : sentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border/70 text-muted-foreground text-center">
              <Send className="h-10 w-10 stroke-1 text-muted-foreground/50 mb-3" />
              <h3 className="text-sm font-semibold text-foreground">No outgoing requests</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Invitations you send to other users will show up here until they respond.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60 rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm">
              {sentRequests.map((req) => {
                const receiver = req.receiver;
                const isProcessing = actionLoading === req.id;
                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {receiver?.profilePicUrl ? (
                        <img
                          src={receiver.profilePicUrl}
                          alt={receiver.username}
                          className="w-11 h-11 rounded-full object-cover bg-muted ring-1 ring-border/50"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm ring-1 ring-border/50">
                          {receiver?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {receiver?.username || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Pending invitation
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(req.id, receiver?.id)}
                      disabled={isProcessing}
                      className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive"
                    >
                      {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Cancel Request'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
