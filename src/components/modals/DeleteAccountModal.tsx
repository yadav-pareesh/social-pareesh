import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../common/Dialog';
import { Button } from '../common/Button';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { usersAPI } from '../../services/api/users';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../ui/toast';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountModal = ({ open, onOpenChange }: DeleteAccountModalProps) => {
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { logout } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!confirmed) {
      toast({
        title: 'Confirmation required',
        description: 'Please confirm that you understand this action is permanent.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await usersAPI.deleteAccount(password.trim() || undefined);
      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently removed.',
      });
      logout();
      navigate('/login');
    } catch (err: any) {
      toast({
        title: 'Failed to Delete Account',
        description: err?.response?.data?.error || err?.message || 'Incorrect password or error occurred',
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
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Delete Account</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                This action is permanent and cannot be undone. All your messages, media, and friendships will be deleted.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-3">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your current password"
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="accent-destructive h-4 w-4 mt-0.5"
            />
            <span className="text-xs text-destructive font-medium leading-tight">
              I understand that deleting my account is permanent, irreversible, and deletes all my data.
            </span>
          </label>
        </div>

        <DialogFooter className="mt-5 flex items-center justify-end gap-2">
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
            onClick={handleDelete}
            disabled={loading || !confirmed}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-1.5">
                <Trash2 className="h-4 w-4" /> Delete Account
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
