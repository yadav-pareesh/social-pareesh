import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../common/Dialog';
import { Button } from '../common/Button';
import { Flag, Loader2 } from 'lucide-react';
import { usersAPI } from '../../services/api/users';
import { useToast } from '../ui/toast';

interface ReportUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
}

const REPORT_REASONS = [
  'Spam',
  'Harassment',
  'Inappropriate content',
  'Fake account',
  'Other',
] as const;

export const ReportUserModal = ({
  open,
  onOpenChange,
  userId,
  username,
}: ReportUserModalProps) => {
  const [selectedReason, setSelectedReason] = useState<(typeof REPORT_REASONS)[number]>('Spam');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReport = async () => {
    try {
      setLoading(true);
      await usersAPI.reportUser(userId, {
        reason: selectedReason,
        details: details.trim() || undefined,
      });

      toast({
        title: 'Report Submitted',
        description: `Thank you for reporting ${username}. Our safety moderation team will review this report.`,
      });

      setDetails('');
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Report Failed',
        description: err?.response?.data?.error || err?.message || 'Failed to submit report',
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
            <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Report {username}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Help us keep the community safe. The reported user will not know who reported them.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-3">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Reason for reporting
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedReason === reason
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-primary h-4 w-4"
                  />
                  <span className="text-sm font-medium">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context or incident details..."
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
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
            variant="default"
            onClick={handleReport}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
