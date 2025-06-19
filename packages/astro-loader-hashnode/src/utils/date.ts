/**
 * Date and Time Utilities
 */

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string,
  options: {
    format?: 'short' | 'medium' | 'long' | 'iso';
    locale?: string;
    timezone?: string;
  } = {}
): string {
  const { format = 'medium', locale = 'en-US', timezone } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    ...(timezone && { timeZone: timezone }),
  };

  switch (format) {
    case 'short':
      formatOptions.dateStyle = 'short';
      break;
    case 'medium':
      formatOptions.dateStyle = 'medium';
      break;
    case 'long':
      formatOptions.dateStyle = 'long';
      break;
    case 'iso':
      return dateObj.toISOString().split('T')[0];
    default:
      formatOptions.dateStyle = 'medium';
  }

  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
}

/**
 * Calculate time ago from a date
 */
export function timeAgo(
  date: Date | string,
  options: {
    locale?: string;
    short?: boolean;
  } = {}
): string {
  const { locale = 'en-US', short = false } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  // Use Intl.RelativeTimeFormat for proper localization
  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
    style: short ? 'short' : 'long',
  });

  // Define time units in seconds
  const units: Array<[string, number]> = [
    ['year', 365 * 24 * 60 * 60],
    ['month', 30 * 24 * 60 * 60],
    ['week', 7 * 24 * 60 * 60],
    ['day', 24 * 60 * 60],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];

  for (const [unit, secondsInUnit] of units) {
    const amount = Math.floor(diffInSeconds / secondsInUnit);

    if (Math.abs(amount) >= 1) {
      return rtf.format(-amount, unit as Intl.RelativeTimeFormatUnit);
    }
  }

  return rtf.format(0, 'second');
}

/**
 * Check if a date is recent (within specified days)
 */
export function isRecent(
  date: Date | string,
  daysThreshold: number = 7
): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  return diffInDays <= daysThreshold && diffInDays >= 0;
}
