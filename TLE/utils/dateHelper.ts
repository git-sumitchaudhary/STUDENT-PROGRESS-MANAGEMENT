
export const formatDate = (timestampSeconds: number | string | Date, format: string = 'YYYY-MM-DD HH:mm'): string => {
  const date = typeof timestampSeconds === 'number' ? new Date(timestampSeconds * 1000) : new Date(timestampSeconds);
  if (isNaN(date.getTime())) return "Invalid Date";

  const pad = (n: number) => n < 10 ? '0' + n : n.toString();

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  // const seconds = pad(date.getSeconds());

  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }
  if (format === 'DD MMM YYYY') {
    const monthStr = date.toLocaleString('default', { month: 'short' });
    return `${day} ${monthStr} ${year}`;
  }
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const getUTCDateYYYYMMDD = (timestampSeconds: number): string => {
  const date = new Date(timestampSeconds * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatUTCDateStringToTooltip = (utcDateString: string): string => {
  // utcDateString is 'YYYY-MM-DD'
  // Create a date object, interpreting the input as UTC.
  // Adding 'T00:00:00Z' ensures it's parsed as UTC midnight.
  const date = new Date(`${utcDateString}T00:00:00Z`);
  if (isNaN(date.getTime())) return "Invalid Date";

  // Use toLocaleDateString with UTC timezone option for consistent formatting
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC', // Ensure formatting is based on UTC values
  });
};

export const getDaysAgoDate = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

export const isDateAfter = (dateToCheck: Date, referenceDate: Date): boolean => {
    return dateToCheck.getTime() > referenceDate.getTime();
};

export const formatRelativeTime = (isoDateString: string | null): string => {
  if (!isoDateString) return "Never";
  const date = new Date(isoDateString);
  const now = new Date();
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};