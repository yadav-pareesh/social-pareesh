import { Button } from '../common/Button';
import { AlertCircle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDeleteModal = ({
  title,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDeleteModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex gap-4 mb-4">
          <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0" />
          <div>
            <h2 className="font-bold text-lg">{title}</h2>
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
};