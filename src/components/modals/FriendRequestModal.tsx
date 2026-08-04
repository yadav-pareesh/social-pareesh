import type { FriendRequest, User } from '../../types';
import { Button } from '../common/Button';
import { Check, X } from 'lucide-react';
import { useAcceptFriendRequest, useRejectFriendRequest } from '../../hooks/useFriends';

interface FriendRequestModalProps {
  requests: FriendRequest[];
  onClose?: () => void;
}

export const FriendRequestModal = ({ requests, onClose }: FriendRequestModalProps) => {
  const acceptMutation = useAcceptFriendRequest();
  const rejectMutation = useRejectFriendRequest();

  if (requests.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No friend requests
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 max-h-96 overflow-y-auto">
      {requests.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between p-3 border rounded-lg bg-card"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              {request.sender.profilePicUrl ? (
                <img
                  src={request.sender.profilePicUrl}
                  alt={request.sender.username}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <span className="text-sm font-bold">
                  {request.sender.username[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{request.sender.username}</p>
              <p className="text-xs text-muted-foreground">{request.sender.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => acceptMutation.mutate(request.id)}
              disabled={acceptMutation.isPending}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => rejectMutation.mutate(request.id)}
              disabled={rejectMutation.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};