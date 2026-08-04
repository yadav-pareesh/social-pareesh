import { formatDistanceToNow, formatDate as formatDateFns } from 'date-fns';

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(dateObj);
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDateFns(dateObj, 'MMM d, yyyy');
};

export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirstLetter = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const formatLastSeen = (date?: Date | string | null): string => {
  // Return "recently" if date is undefined, null, or empty string
  if (!date) {
    return 'recently';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Reset hours to accurately calculate calendar day differences
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

  const timeStr = formatTime(dateObj).toLowerCase(); // e.g., "03:45 pm"

  if (startOfDate.getTime() === startOfToday.getTime()) {
    return `today at ${timeStr}`;
  } 
  
  if (startOfDate.getTime() === startOfYesterday.getTime()) {
    return `yesterday at ${timeStr}`;
  }

  // For older dates, formats as "last seen MMM d, yyyy at hh:mm am/pm"
  return `${formatDate(dateObj)} at ${timeStr}`;
};
