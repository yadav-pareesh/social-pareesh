import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '../../services/api/users';
import { useDebounce } from '../../hooks/useDebounce';
import { Input } from '../common/Input';
import { Search } from 'lucide-react';
import type { User } from '../../types';

interface SearchUsersProps {
  onSelectUser: (user: User) => void;
}

export const SearchUsers = ({ onSelectUser }: SearchUsersProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: searchResults } = useQuery({
    queryKey: ['searchUsers', debouncedQuery],
    queryFn: () => usersAPI.searchUsers(debouncedQuery, 10),
    enabled: debouncedQuery.length > 0,
  });

  return (
    <div className="p-4 border-b">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchResults?.data?.items && searchResults.data.items.length > 0 && (
        <div className="mt-2 bg-popover border rounded-lg overflow-hidden">
          {searchResults.data.items.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onSelectUser(user);
                setSearchQuery('');
              }}
              className="w-full px-3 py-2 text-left hover:bg-accent border-b last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  {user.profilePicUrl ? (
                    <img
                      src={user.profilePicUrl}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <span className="text-xs font-bold">{user.username[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};