// import { useQuery } from '@tanstack/react-query';
// import { friendsAPI } from '../../services/api/friends';
import type{ User } from '../../types';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card';
import { MessageSquare, Trash2 } from 'lucide-react';

export const FriendsList = () => {
  // const { data: friendsData, isLoading } = useQuery({
  //   queryKey: ['friends'],
  //   queryFn: () => friendsAPI.getFriends(),
  // });

  // const friends = mockUsers || [];

  // if (isLoading) {
  //   return <div>Loading friends...</div>;
  // }

  // if (friends?.length === 0) {
  //   return (
  //     <Card>
  //       <CardContent className="flex items-center justify-center h-32">
  //         <p className="text-muted-foreground">No friends yet</p>
  //       </CardContent>
  //     </Card>
  //   );
  // }

  return (
    <Card>
      <CardHeader>
        {/* <CardTitle>Friends ({friends?.length})</CardTitle> */}
        <CardTitle>Friends ({[]?.length})</CardTitle>
        <CardDescription>Your friend list</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[].map((friend: User) => (
            <div
              key={friend.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  user={friend}
                  src={friend.profilePicUrl}
                  alt={friend.username}
                  fallback={friend.username[0]}
                  size="sm"
                />
                <div>
                  <p className="font-medium text-sm">{friend.username}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {friend.status === 'online' ? '🟢 Online' : '⚫ Offline'}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="icon" variant="ghost">
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};