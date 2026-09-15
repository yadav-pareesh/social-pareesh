import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../common/Dialog';
import { Button } from '../common/Button';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { friendsAPI } from '../../services/api/friends';
import { useFriendStore } from '../../stores/friendStore';
import { getSocket } from '../../services/socket';
import { useToast } from '../ui/toast';

interface BlockUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
  onSuccess?: () => void;
}

export const BlockUserModal = ({
  open,
  onOpenChange,
  userId,
  username,
  onSuccess,
}: BlockUserModalProps) => {
  const [loading, setLoading] = useState(false);
  const { addBlockedUser, removeFriend } = useFriendStore();
  const { toast } = useToast();

  const handleBlock = async () => {
    try {
      setLoading(true);
      await friendsAPI.blockUser(userId);
      addBlockedUser({ id: userId, username });
      removeFriend(userId);

      const socket = getSocket();
      if (socket) {
        socket.emit('user:block', { targetUserId: userId });
      }

      toast({
        title: 'User Blocked',
        description: `${username} has been blocked. They can no longer message or call you.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: 'Failed to Block User',
        description: err?.response?.data?.error || err?.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Block {username}?</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Blocked contacts can no longer send you messages, friend requests, or initiate calls.
              </p>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-6 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleBlock}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Block User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
