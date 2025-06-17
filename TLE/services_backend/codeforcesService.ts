import { CODEFORCES_API_BASE_URL } from '../constants'; 
import { CFUserInfo, CFContest, CFSubmission, CFContestProblem } from '../types'; 

const CF_API_DELAY = 1200; // Milliseconds to delay between API calls to avoid rate limiting
const CACHE_PREFIX = 'cfApiCache_';
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface CachedData<T> {
  timestamp: number;
  data: T;
}

export const clearCache = (): void => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  console.log("Cleared all Codeforces API cache.");
};

export const clearEndpointCache = (endpoint: string): void => {
  const cacheKey = `${CACHE_PREFIX}${endpoint}`;
  localStorage.removeItem(cacheKey);
  console.log(`Cache cleared for endpoint: ${endpoint}`);
};


async function fetchCF<T>(endpoint: string, forceRefresh: boolean = false): Promise<T> {
  const cacheKey = `${CACHE_PREFIX}${endpoint}`;

  if (!forceRefresh) {
    const cachedItem = localStorage.getItem(cacheKey);
    if (cachedItem) {
      try {
        const parsedCache: CachedData<T> = JSON.parse(cachedItem);
        if (Date.now() - parsedCache.timestamp < CACHE_TTL_MS) {
          // console.log(`Using cached data for ${endpoint}`);
          return parsedCache.data;
        } else {
          localStorage.removeItem(cacheKey); // Cache expired
          // console.log(`Cache expired for ${endpoint}`);
        }
      } catch (e) {
        console.error("Failed to parse cache, removing item:", e);
        localStorage.removeItem(cacheKey);
      }
    }
  } else {
     // console.log(`Force refreshing, clearing cache for ${endpoint}`);
     localStorage.removeItem(cacheKey);
  }

  await delay(CF_API_DELAY);
  // console.log(`Fetching fresh data for ${endpoint}`);
  const response = await fetch(`${CODEFORCES_API_BASE_URL}/${endpoint}`);
  if (!response.ok) {
    const errorText = await response.text(); // Read text first
    let errorData = { comment: `Failed to parse error response: ${errorText}` };
    try {
        errorData = JSON.parse(errorText); // Try to parse as JSON
    } catch(e) { /* ignore if not json */ }
    throw new Error(`Codeforces API error: ${response.status} ${response.statusText}. ${errorData.comment || ''}`);
  }
  const data = await response.json();
  if (data.status !== "OK") {
    throw new Error(`Codeforces API error: ${data.comment || 'Unknown error'}`);
  }

  // Save to cache
  const newCacheItem: CachedData<T> = {
    timestamp: Date.now(),
    data: data.result,
  };
  try {
    localStorage.setItem(cacheKey, JSON.stringify(newCacheItem));
  } catch (e) {
    console.error("Failed to save to localStorage (maybe full?):", e);
     // If storage is full, try to clear some old cache for this prefix
    Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX)).slice(0, 5).forEach(k => localStorage.removeItem(k));
    try {
        localStorage.setItem(cacheKey, JSON.stringify(newCacheItem)); // Try again
    } catch (e2) {
        console.error("Failed to save to localStorage again:", e2);
    }
  }
  return data.result;
}

export const getUserInfo = async (handles: string[], forceRefresh: boolean = false): Promise<CFUserInfo[]> => {
  if (handles.length === 0) return [];
  return fetchCF<CFUserInfo[]>(`user.info?handles=${handles.join(';')}`, forceRefresh);
};

export const getUserRatingHistory = async (handle: string, forceRefresh: boolean = false): Promise<CFContest[]> => {
  return fetchCF<CFContest[]>(`user.rating?handle=${handle}`, forceRefresh);
};

export const getUserSubmissions = async (handle: string, count: number = 1000, forceRefresh: boolean = false): Promise<CFSubmission[]> => {
  return fetchCF<CFSubmission[]>(`user.status?handle=${handle}&from=1&count=${count}`, forceRefresh);
};

export const getContestProblems = async (contestId: number, forceRefresh: boolean = false): Promise<CFContestProblem[]> => {
  try {
    const result = await fetchCF<{ contest: any; problems: CFContestProblem[]; rows: any[] }>(`contest.standings?contestId=${contestId}&from=1&count=1&showUnofficial=false`, forceRefresh);
    return result.problems.map(p => ({ ...p, contestId }));
  } catch (error) {
    console.error(`Failed to fetch problems for contest ${contestId}:`, error);
    return []; 
  }
};