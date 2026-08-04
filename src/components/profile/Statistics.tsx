import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';

interface StatisticsProps {
  friendsCount?: number;
  messagesSentCount?: number;
  groupsCount?: number;
}

export const Statistics = ({
  friendsCount = 0,
  messagesSentCount = 0,
  groupsCount = 0,
}: StatisticsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Friends</p>
          <p className="text-2xl font-bold">{friendsCount}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Messages Sent</p>
          <p className="text-2xl font-bold">{messagesSentCount}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Groups</p>
          <p className="text-2xl font-bold">{groupsCount}</p>
        </div>
      </CardContent>
    </Card>
  );
};