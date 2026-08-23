import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '../../services/api/users';
import { useDebounce } from '../../hooks/useDebounce';
import type { User } from '../../types';
import { ChatSearchBar } from './ChatSearchBar';
import { useAuthStore } from '../../stores/authStore';

interface SearchUsersProps {
  onSelectUser: (user: User) => void;
  title?: React.ReactNode;
  className?: string;
}

export const SearchUsers = ({
  onSelectUser,
  title = 'Messages',
  className = '',
}: SearchUsersProps) => {
  const { user: currentUser } = useAuthStore(); // 1. Get logged-in user
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearchInput, setShowSearchInput] = React.useState(false);
  
  const debouncedQuery = useDebounce(searchQuery, 300);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 2. Click-Outside Handler: Closes dropdown if user clicks elsewhere
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSearchInput(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Fetch Data with Loading State
  const { data: searchResults, isFetching } = useQuery({
    queryKey: ['searchUsers', debouncedQuery],
    queryFn: () => usersAPI.searchUsers(debouncedQuery, 10),
    enabled: debouncedQuery.trim().length > 0,
  });

  const handleOpenSearch = React.useCallback(() => {
    setShowSearchInput(true);
  }, []);

  const handleClearSearch = React.useCallback(() => {
    setSearchQuery('');
    setShowSearchInput(false);
  }, []);

  const handleSelect = React.useCallback(
    (user: User) => {
      onSelectUser(user);
      handleClearSearch();
    },
    [onSelectUser, handleClearSearch]
  );

  // 4. Memoized Filter: Removes logged-in user and safely handles array fallbacks
  const filteredUsers = React.useMemo(() => {
    const rawItems = searchResults?.data?.items ?? (Array.isArray(searchResults?.data) ? searchResults.data : []);
    return rawItems.filter((u: User) => u.id !== currentUser?.id);
  }, [searchResults, currentUser?.id]);

  const showDropdown = showSearchInput && debouncedQuery.trim().length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <ChatSearchBar
        title={title}
        isOpen={showSearchInput}
        onOpen={handleOpenSearch}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={handleClearSearch}
        placeholder="Search users..."
      />

      {/* Results Dropdown with robust Loading & Empty states */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md z-50 custom-scrollbar">
          {isFetching ? (
            <div className="p-4 flex items-center justify-center text-muted-foreground text-sm">
              <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Searching...
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user)}
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground border-b border-border/50 last:border-b-0 transition-colors focus-visible:outline-none focus-visible:bg-accent"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border">
                    {user.profilePicUrl ? (
                      <img
                        src={user.profilePicUrl}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">
                        {user.username?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{user.email}</p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No users found matching "{debouncedQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};