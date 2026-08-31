import { Phone, Video, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { CallRecord } from '../types';
import { useCallStore } from '../stores/callStore';
import { getSocket } from '../services/socket';
import { useCallHistory } from '@/hooks/useCallHistory';
import { CallIcon } from '@/components/call/CallIcon';

const formatDuration = (seconds?: number) => {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

export const CallHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const setCallState = useCallStore(state => state.setCallState);
  
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useCallHistory();

  const calls = data?.pages.flatMap((page) => page.items) || [];

  const handleInitiateCall = (userId: string, isVideo: boolean) => {
    if (!user?.id) return; 

    setCallState('calling', { targetUserId: userId, withVideo: isVideo });
    const socket = getSocket();
    
    socket.emit('call:initiate', {
      targetUserId: userId,
      callerId: user.id, 
      withVideo: isVideo
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground h-[100dvh] w-full bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          <p className="text-sm font-medium">Loading calls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full w-full overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl p-6 sm:p-10 space-y-8">
      
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Call History</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review your recent audio and video conversations.
            </p>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          {calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed border-border/60 bg-card/10 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Phone className="h-6 w-6 text-muted-foreground opacity-50" />
              </div>
              <div>
                <p className="text-sm font-medium">No recent calls</p>
                <p className="text-xs text-muted-foreground mt-1">Your call history will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card/40 overflow-hidden shadow-sm">
              {calls.map((call: CallRecord) => {
                const isOutgoing = call.callerId === user?.id;
                const isMissed = call.status === 'missed' && !isOutgoing;
                const durationText = formatDuration(call.duration);

                const timeString = new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(call.startedAt));

                return (
                  <div key={call.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                    
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {call.otherUser.profilePicUrl ? (
                          <img 
                            src={call.otherUser.profilePicUrl} 
                            alt={call.otherUser.username} 
                            className="w-10 h-10 rounded-full object-cover bg-muted ring-1 ring-border/50"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary ring-1 ring-border/50">
                            {call.otherUser.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isMissed ? 'text-destructive' : 'text-foreground'}`}>
                          {call.otherUser.username}
                        </p>
                        
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5 gap-1.5">
                          <CallIcon 
                            isMissed={isMissed} 
                            isOutgoing={isOutgoing} 
                            type={call.type} 
                          />
                          
                          <span className="truncate">{timeString}</span>
                          
                          {call.status === 'completed' && durationText && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                              <span className="truncate">{durationText}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleInitiateCall(call.otherUser.id, false); }}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent text-muted-foreground transition-colors shadow-sm"
                        aria-label="Audio call"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleInitiateCall(call.otherUser.id, true); }}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent text-muted-foreground transition-colors shadow-sm"
                        aria-label="Video call"
                      >
                        <Video className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {hasNextPage && (
                <div className="p-3 bg-muted/10">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {isFetchingNextPage ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Loading...</>
                    ) : (
                      'Load older calls'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};