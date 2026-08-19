import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '../../services/api/users';
import { useDebounce } from '../../hooks/useDebounce';
import type { User } from '../../types';
import { ChatSearchBar } from './ChatSearchBar';

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
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearchInput, setShowSearchInput] = React.useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: searchResults } = useQuery({
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

  const items = searchResults?.data?.items ?? [];

  return (
    <div className={`relative w-full ${className}`}>
      <ChatSearchBar
        title={title}
        isOpen={showSearchInput}
        onOpen={handleOpenSearch}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={handleClearSearch}
        placeholder="Search users..."
      />

      {/* Results Dropdown */}
      {showSearchInput && items.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md z-50">
          {items.map((user) => (
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
          ))}
        </div>
      )}
    </div>
  );
};