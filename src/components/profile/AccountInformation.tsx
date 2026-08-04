import { Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card';
import { Badge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';
import type { User } from '@/types';

interface AccountInformationProps {
  profile: User;
}

export const AccountInformation = ({ profile }: AccountInformationProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
        <CardDescription>Details about your account</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Member Since */}
        <div className="flex items-center justify-between p-3 bg-muted rounded">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Member Since</span>
          </div>
          <span className="text-sm font-medium">
            {formatDate(new Date(profile.createdAt))}
          </span>
        </div>

        {/* Last Seen */}
        <div className="flex items-center justify-between p-3 bg-muted rounded">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Last Seen</span>
          </div>
          <span className="text-sm font-medium">
            {profile.lastSeen
              ? new Date(profile.lastSeen).toLocaleString()
              : 'Now'}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded">
          <span className="text-sm">Current Status</span>
          <Badge variant="default">
            {profile.status === 'online'
              ? '🟢 Online'
              : profile.status === 'away'
              ? '🟡 Away'
              : '⚫ Offline'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};