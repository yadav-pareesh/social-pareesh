import { useState, useEffect } from 'react';
import { ArrowLeft, Search, UserPlus, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { User } from '../types';
import { messagesAPI } from '../services/api/messages';
import { useChatStore } from '../stores/chatStore';
import { usersAPI } from '@/services/api/users';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const Friends = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const setActiveConversation = useChatStore(state => state.setActiveConversation);

  const { data: users = [], isLoading, isFetching } = useQuery({
    queryKey: ['searchUsers', debouncedSearch],
    queryFn: async () => {
      const response = await usersAPI.searchUsers(debouncedSearch, 20);
      
      let list: User[] = [];
      if (Array.isArray(response.data)) {
        list = response.data;
      } else if (response.data && Array.isArray((response.data as any).items)) {
        list = (response.data).items;
      } else if (Array.isArray((response as any).items)) {
        list = (response as any).items;
      }
      return list;
    },
    placeholderData: (previousData) => previousData,
  });

  const handleStartChat = async (userId: string) => {
    try {
      const response = await messagesAPI.startConversation(userId);
      if (response.data) {
        setActiveConversation(response.data.id);
        navigate('/chat');
      }
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  return (
    <div className="flex flex-1 h-full w-full overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl p-6 sm:p-10 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Friends</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Find friends and start new conversations.
            </p>
          </div>
          <button 
            aria-label="Add Friend"
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserPlus className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-9 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all shadow-sm"
          />
          {isFetching && (
            <Loader2 className="absolute right-3 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Content Area */}
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold tracking-tight">
              {searchQuery ? 'Search Results' : 'Friends on App'}
            </h3>
            <span className="text-xs text-muted-foreground">{users.length} found</span>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border bg-card/40 overflow-hidden shadow-sm">
            {isLoading && users.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p className="text-sm">Searching for friends...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-sm">
                <p>No friends found {searchQuery && `matching "${searchQuery}"`}</p>
              </div>
            ) : (
              users.map((user) => (
                <div 
                  key={user.id} 
                  onClick={() => handleStartChat(user.id)}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {user.profilePicUrl ? (
                        <img 
                          src={user.profilePicUrl} 
                          alt={user.username} 
                          className="w-10 h-10 rounded-full object-cover bg-muted ring-1 ring-border/50"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary ring-1 ring-border/50">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.username}</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground shadow-sm">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};