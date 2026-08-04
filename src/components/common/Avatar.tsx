import { useChatStore } from '../../stores/chatStore';
import { cn } from '../../lib/utils';
import type { User } from '../../types';

interface AvatarProps {
  user: User;
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showOnlineIndicator?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

// WhatsApp-style indicator sizes (scaled to avatar)
const indicatorSizes = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
  xl: 'h-5 w-5',
};

export const Avatar = ({
  user,
  src = user.profilePicUrl,
  alt = user.username,
  fallback = user.username?.[0],
  size = 'md',
  className,
  showOnlineIndicator = true,
}: AvatarProps) => {
  const isOnline = useChatStore((state) => state.isUserOnline(user.id));

  const indicatorSize = indicatorSizes[size];

  return (
    <div
      className={cn(
        'relative rounded-full bg-muted flex items-center justify-center ',
        sizeClasses[size],
        className
      )}
      aria-label={`${alt} avatar`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Graceful fallback if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span className={cn('font-semibold text-foreground', textSizes[size])}>
          {fallback ? fallback.toUpperCase() : 'U'}
        </span>
      )}

      {showOnlineIndicator && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-background transition-colors',
            indicatorSize,
            isOnline
              ? 'bg-emerald-500 shadow-[0_0_0_2px_rgb(16,185,129,0.3)]'
              : 'bg-gray-400 dark:bg-gray-600'
          )}
          title={isOnline ? 'Online' : 'Offline'}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};