import { useUIStore } from '@/stores/uiStore';
import { Button } from '../common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Bell, Lock, Shield, Settings } from 'lucide-react';

interface QuickActionsProps {
  onNotifications?: () => void;
  onPassword?: () => void;
  onPrivacy?: () => void;
  onPreferences?: () => void;
}

export const QuickActions = ({
  onNotifications,
  onPassword,
  onPrivacy,
  onPreferences,
}: QuickActionsProps) => {
  const { showChangePassword, setShowChangePassword } = useUIStore();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onNotifications}
        >
          <Bell className="h-4 w-4 mr-2" />
          Notification Settings
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setShowChangePassword(true)}
        >
          <Lock className="h-4 w-4 mr-2" />
          Change Password
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onPrivacy}
        >
          <Shield className="h-4 w-4 mr-2" />
          Privacy Settings
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onPreferences}
        >
          <Settings className="h-4 w-4 mr-2" />
          Preferences
        </Button>
      </CardContent>
    </Card>
  );
};