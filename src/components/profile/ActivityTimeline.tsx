import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card';
import { MessageSquare, UserPlus, Settings } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

interface Activity {
  id: string;
  type: 'message' | 'friend' | 'setting';
  description: string;
  timestamp: Date;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'message',
    description: 'You sent a message to John Doe',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: '2',
    type: 'friend',
    description: 'You accepted a friend request from Sarah Smith',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'setting',
    description: 'You updated your profile',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

export const ActivityTimeline = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'friend':
        return <UserPlus className="h-4 w-4" />;
      case 'setting':
        return <Settings className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your recent actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex gap-4">
              <div className="flex h-full items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {getIcon(activity.type)}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};