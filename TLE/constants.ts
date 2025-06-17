
export const CODEFORCES_API_BASE_URL = "https://codeforces.com/api";

export const TIME_FILTER_OPTIONS_CONTEST: { label: string; value: string; days: number | null }[] = [
  { label: "Last 30 Days", value: "30D", days: 30 },
  { label: "Last 90 Days", value: "90D", days: 90 },
  { label: "Last 365 Days", value: "365D", days: 365 },
  { label: "All Time", value: "ALL", days: null },
];

export const TIME_FILTER_OPTIONS_PROBLEMS: { label: string; value: string; days: number }[] = [
  { label: "Last 7 Days", value: "7D", days: 7 },
  { label: "Last 30 Days", value: "30D", days: 30 },
  { label: "Last 90 Days", value: "90D", days: 90 },
];

export const PROBLEM_RATING_BUCKETS: number[] = [
  800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200, 3500
];

export const INACTIVITY_THRESHOLD_DAYS = 7;
    