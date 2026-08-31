import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Video } from 'lucide-react';

interface CallIconProps {
  isMissed: boolean;
  isOutgoing: boolean;
  type: string;
}

export const CallIcon = ({ isMissed, isOutgoing, type }: CallIconProps) => {
  const isVideo = type === 'video';

  if (isMissed) {
    return  (
      <span className="flex items-center gap-1 text-destructive font-medium">
        {isVideo ? <Video className="h-3.5 w-3.5" /> : <PhoneMissed className="h-3.5 w-3.5 text-destructive" />} miss
      </span>
    ) 
  }

  if (isOutgoing) {
    return  (
      <span className="flex items-center gap-1 text-green-500 font-medium">
        {isVideo ? <Video className="h-3.5 w-3.5" /> : <PhoneOutgoing className="h-3.5 w-3.5 text-green-500" />} out
      </span>
    );
  }

  return  (
    <span className="flex items-center gap-1 text-blue-500 font-medium">
     {isVideo ? <Video className="h-3.5 w-3.5" /> : <PhoneIncoming className="h-3.5 w-3.5 text-blue-500" />} inc
    </span>
  );
};