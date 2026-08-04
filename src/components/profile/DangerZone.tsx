import { Button } from '../common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { LogOut, Trash2 } from 'lucide-react';

interface DangerZoneProps {
  onLogout: () => void;
  onDelete: () => void;
  isLoggingOut?: boolean;
  isDeletingAccount?: boolean;
}

export const DangerZone = ({
  onLogout,
  onDelete,
  isLoggingOut = false,
  isDeletingAccount = false,
}: DangerZoneProps) => {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Button>
        <Button
          variant="destructive"
          className="w-full justify-start"
          onClick={onDelete}
          disabled={isDeletingAccount}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
        </Button>
      </CardContent>
    </Card>
  );
};