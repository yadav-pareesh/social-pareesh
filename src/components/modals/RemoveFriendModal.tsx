import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../common/Dialog';
import { Button } from '../common/Button';
import { UserMinus, Loader2 } from 'lucide-react';
import { friendsAPI } from '../../services/api/friends';
import { useFriendStore } from '../../stores/friendStore';
import { getSocket } from '../../services/socket';
import { useToast } from '../ui/toast';

interface RemoveFriendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendId: string;
  friendName: string;
  onSuccess?: () => void;
}

export const RemoveFriendModal = ({
  open,
  onOpenChange,
  friendId,
  friendName,
  onSuccess,
}: RemoveFriendModalProps) => {
  const [loading, setLoading] = useState(false);
  const { removeFriend } = useFriendStore();
  const { toast } = useToast();

  const handleRemove = async () => {
    try {
      setLoading(true);
      await friendsAPI.removeFriend(friendId);
      removeFriend(friendId);

      const socket = getSocket();
      if (socket) {
        socket.emit('friend:remove', { targetUserId: friendId });
      }

      toast({
        title: 'Friend Removed',
        description: `${friendName} was removed from your friends list.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.error || err?.message || 'Failed to remove friend',
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
              <UserMinus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Remove {friendName}?</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Are you sure you want to remove {friendName} from your friends? Existing chat history will be kept.
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
            onClick={handleRemove}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove Friend'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
