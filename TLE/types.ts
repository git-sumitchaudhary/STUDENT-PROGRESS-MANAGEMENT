
// Basic Student Information
export interface Student {
  id: string; // UUID
  name: string;
  email: string;
  phoneNumber: string;
  codeforcesHandle: string;
  currentRating: number | null;
  maxRating: number | null;
  lastSyncedAt: string | null; // ISO date string
  reminderSentCount: number;
  disableReminders: boolean;
  lastSubmissionDate?: string | null; // ISO date string for inactivity check
}

// Codeforces User Info API Response Subset
export interface CFUserInfo {
  handle: string;
  rating?: number;
  maxRating?: number;
  avatar?: string;
  rank?: string;
  maxRank?: string;
}

// Codeforces User Rating API Response Subset (Contest)
export interface CFContest {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

// Codeforces Problem API Response Subset
export interface CFProblem {
  contestId?: number;
  index: string;
  name: string;
  type?: string; // PROGRAMMING, QUESTION
  points?: number;
  rating?: number; // Problem difficulty rating
  tags: string[];
}

// Codeforces Submission API Response Subset
export interface CFSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  problem: CFProblem;
  programmingLanguage: string;
  verdict?: "OK" | "WRONG_ANSWER" | "TIME_LIMIT_EXCEEDED" | "MEMORY_LIMIT_EXCEEDED" | "COMPILATION_ERROR" | "RUNTIME_ERROR" | "SKIPPED" | "CHALLENGED" | "PARTIAL" | "PRESENTATION_ERROR" | "IDLENESS_LIMIT_EXCEEDED" | "SECURITY_VIOLATED" | "CRASHED" | "INPUT_PREPARATION_CRASHED" | "TESTING";
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
}

export interface ContestWithDetails extends CFContest {
  problemsSolved: number;
  problemsUnsolved: number; // Based on contest problem list
  totalProblemsInContest: number;
}

// For charts
export interface RatingDataPoint {
  date: string; // Formatted date
  rating: number;
  contestName: string;
}

export interface ProblemCountDataPoint {
  ratingBucket: string; // e.g., "800-999", "1000-1199"
  count: number;
}

export interface HeatmapDataPoint {
  date: string; // YYYY-MM-DD
  count: number; // Number of submissions
}

// Filter enums
export enum TimeFilterOption {
  LAST_7_DAYS = "7D",
  LAST_30_DAYS = "30D",
  LAST_90_DAYS = "90D",
  LAST_365_DAYS = "365D",
  ALL_TIME = "ALL",
}

export interface CFContestProblem { // Problem as defined in contest.standings
  contestId: number;
  index: string;
  name: string;
  type: string;
  points?: number;
  rating?: number;
  tags: string[];
}
    