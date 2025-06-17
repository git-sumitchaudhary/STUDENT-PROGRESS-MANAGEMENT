import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, Variants } from 'framer-motion';
import { CFContest, RatingDataPoint, TimeFilterOption, Student, ContestWithDetails, CFContestProblem, CFSubmission } from '../types'; 
import { getUserRatingHistory, getContestProblems, getUserSubmissions } from '../services_backend/codeforcesService'; 
import { RatingChart } from './common/RatingChart'; 
import { Button } from './common/Button'; 
import { TIME_FILTER_OPTIONS_CONTEST } from '../constants'; 
import { formatDate, getDaysAgoDate, isDateAfter } from '../utils/dateHelper'; 
import { ModernSpinner } from './common/ModernSpinner'; 

interface ContestHistorySectionProps {
  student: Student;
  forceRefreshTrigger?: number; 
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, duration: 0.4, ease: "easeOut" as const } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

const CONTEST_DETAILS_BATCH_SIZE = 10; // Number of contests to fetch details for at a time

export const ContestHistorySection: React.FC<ContestHistorySectionProps> = ({ student, forceRefreshTrigger = 0 }) => {
  const [filter, setFilter] = useState<string>(TimeFilterOption.LAST_365_DAYS);
  const [contestHistory, setContestHistory] = useState<CFContest[]>([]);
  
  // Stores ContestWithDetails objects as they are fetched
  const [detailedContestsList, setDetailedContestsList] = useState<ContestWithDetails[]>([]);
  // Store all user submissions relevant for the current view, fetched once
  const [currentUserSubmissions, setCurrentUserSubmissions] = useState<CFSubmission[]>([]);
  const [areSubmissionsFetchedForView, setAreSubmissionsFetchedForView] = useState(false);

  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMoreDetails, setIsLoadingMoreDetails] = useState(false);
  const [currentForceRefresh, setCurrentForceRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track which contests from filteredContests have had details attempted/fetched
  const processedContestIds = useMemo(() => new Set(detailedContestsList.map(c => c.contestId)), [detailedContestsList]);

  useEffect(() => {
    if (forceRefreshTrigger > 0) { 
      setCurrentForceRefresh(true); 
    }
  }, [forceRefreshTrigger]);
  
  const resetDetailsState = () => {
    setDetailedContestsList([]);
    setCurrentUserSubmissions([]);
    setAreSubmissionsFetchedForView(false);
  };

  const fetchHistoryCallback = useCallback(async (isForced: boolean) => {
    if (!student.codeforcesHandle) {
        setIsLoadingHistory(false);
        return;
    }
    setIsLoadingHistory(true);
    setError(null);
    if (isForced) {
      resetDetailsState(); // Reset details if forcing refresh of main history
    }
    try {
      const history = await getUserRatingHistory(student.codeforcesHandle, isForced);
      setContestHistory(history.sort((a,b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds));
    } catch (err) {
      console.error("Failed to fetch contest history:", err);
      const msg = err instanceof Error ? err.message : 'Failed to load contest history.';
      setError(msg);
      setContestHistory([]); 
    }
    setIsLoadingHistory(false);
    if (isForced) setCurrentForceRefresh(false); 
  }, [student.codeforcesHandle]);

  useEffect(() => {
    fetchHistoryCallback(currentForceRefresh);
  }, [fetchHistoryCallback, currentForceRefresh]);

  const filteredContests = useMemo(() => {
    const selectedOption = TIME_FILTER_OPTIONS_CONTEST.find(opt => opt.value === filter);
    if (!selectedOption || !selectedOption.days) return contestHistory; 
    
    const cutoffDate = getDaysAgoDate(selectedOption.days);
    return contestHistory.filter(contest => isDateAfter(new Date(contest.ratingUpdateTimeSeconds * 1000), cutoffDate));
  }, [contestHistory, filter]);

  // Effect to reset details when filter changes
  useEffect(() => {
    resetDetailsState();
  }, [filter]);


  const fetchNextBatchOfContestDetails = useCallback(async (isForcedByParent: boolean) => {
    if (filteredContests.length === 0) {
      setIsLoadingMoreDetails(false);
      return;
    }
    setIsLoadingMoreDetails(true);
    if(!isForcedByParent) setError(null); // Clear previous batch errors unless it's a global force refresh continuing an error state

    let submissionsToUse = currentUserSubmissions;
    if (isForcedByParent || !areSubmissionsFetchedForView) {
      try {
        submissionsToUse = await getUserSubmissions(student.codeforcesHandle, 2000, isForcedByParent);
        setCurrentUserSubmissions(submissionsToUse);
        setAreSubmissionsFetchedForView(true);
      } catch (subError) {
        console.error("Failed to fetch user submissions for contest details:", subError);
        const msg = subError instanceof Error ? subError.message : "Could not fetch user submissions for stats.";
        setError(msg); 
        setIsLoadingMoreDetails(false);
        if (isForcedByParent) setCurrentForceRefresh(false);
        return;
      }
    }

    const contestsToFetchDetailsFor = filteredContests
      .filter(c => !processedContestIds.has(c.contestId)) // Only fetch if not already processed
      .slice(0, CONTEST_DETAILS_BATCH_SIZE); // Get the next batch

    if (contestsToFetchDetailsFor.length === 0) {
      setIsLoadingMoreDetails(false);
      if (isForcedByParent) setCurrentForceRefresh(false);
      return;
    }

    const newDetailedContestsBatch: ContestWithDetails[] = [];
    for (const contest of contestsToFetchDetailsFor) {
      try {
        const contestProblems: CFContestProblem[] = await getContestProblems(contest.contestId, isForcedByParent);
        const submissionsForThisContest = submissionsToUse.filter(
            sub => sub.contestId === contest.contestId && sub.verdict === 'OK'
        );
        const solvedProblemIndices = new Set(submissionsForThisContest.map(sub => sub.problem.index));
        
        newDetailedContestsBatch.push({
          ...contest,
          problemsSolved: solvedProblemIndices.size,
          totalProblemsInContest: contestProblems.length,
          problemsUnsolved: Math.max(0, contestProblems.length - solvedProblemIndices.size)
        });
      } catch (loopError) {
          console.error(`Error processing contest ${contest.contestId} details:`, loopError);
          // Add contest even on error to mark as processed, but with default/error values
          newDetailedContestsBatch.push({ ...contest, problemsSolved: 0, problemsUnsolved: 0, totalProblemsInContest: 0, errorFetchingDetails: true } as ContestWithDetails);
      }
    }
    
    setDetailedContestsList(prev => {
        const existingById = new Map(prev.map(c => [c.contestId, c]));
        newDetailedContestsBatch.forEach(c => existingById.set(c.contestId, c));
        // Sort by original contest history order (descending by time)
        return Array.from(existingById.values()).sort((a,b) => b.ratingUpdateTimeSeconds - a.ratingUpdateTimeSeconds);
    });

    setIsLoadingMoreDetails(false);
    if (isForcedByParent) setCurrentForceRefresh(false); 
  }, [
      filteredContests, student.codeforcesHandle, 
      currentUserSubmissions, areSubmissionsFetchedForView, 
      processedContestIds
  ]);
  
  // Effect to load initial batch of details or when filteredContests changes
  useEffect(() => {
    // Only auto-load if detailedContestsList is empty (for this filter)
    // and not currently force-refreshing (let force refresh handle its own trigger)
    if (filteredContests.length > 0 && detailedContestsList.length === 0 && !currentForceRefresh) {
      fetchNextBatchOfContestDetails(false);
    }
    // If currentForceRefresh is true, it implies a parent component wants a full refresh
    if (currentForceRefresh && filteredContests.length > 0) {
        fetchNextBatchOfContestDetails(true);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredContests, fetchNextBatchOfContestDetails, currentForceRefresh]);
  // Note: detailedContestsList removed from deps to avoid re-triggering just because it grew.


  const ratingChartData: RatingDataPoint[] = useMemo(() => {
    // Chart should be based on all filtered contests, not just those with details yet
    return filteredContests.map(contest => ({
      date: formatDate(contest.ratingUpdateTimeSeconds, 'DD MMM YYYY'),
      rating: contest.newRating,
      contestName: contest.contestName,
    })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort for chart
  }, [filteredContests]);

  const canLoadMoreDetails = useMemo(() => {
    return filteredContests.length > detailedContestsList.length;
  }, [filteredContests.length, detailedContestsList.length]);


  if (isLoadingHistory) {
    return (
        <div className="flex flex-col justify-center items-center h-64">
          <ModernSpinner size={60} />
          <p className="mt-3 text-muted-light dark:text-muted-dark">Loading contest history for {student.codeforcesHandle}...</p>
          {currentForceRefresh && <p className="text-sm text-yellow-500">Fetching fresh data...</p>}
        </div>
    );
  }
  
  return (
    <motion.div 
      className="space-y-6"
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center">
        <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2 sm:mb-0">Contest History</h3>
        <div className="flex space-x-2">
          {TIME_FILTER_OPTIONS_CONTEST.map(opt => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                if (filter !== opt.value) { // Only change if filter is different
                    setFilter(opt.value);
                    // Resetting details state is handled by useEffect on [filter]
                }
              }}
              disabled={isLoadingMoreDetails || isLoadingHistory}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </motion.div>
      
      {error && !isLoadingMoreDetails && !isLoadingHistory && ( 
         <motion.div 
            variants={itemVariants} 
            className="p-4 bg-red-100 text-red-700 rounded-md dark:bg-red-800 dark:text-red-200"
          >
            Error: {error}
          </motion.div>
      )}

      {(contestHistory.length === 0 && !isLoadingHistory && !error) ? (
          <motion.p variants={itemVariants} className="text-center text-muted-light dark:text-muted-dark py-4">No contest history found for this student.</motion.p>
      ) : ratingChartData.length === 0 && !isLoadingHistory && !error && contestHistory.length > 0 ? (
          <motion.p variants={itemVariants} className="text-center text-muted-light dark:text-muted-dark py-4">No contests found for the selected period.</motion.p>
      ) : (
        <>
          <motion.div variants={itemVariants}>
            <RatingChart data={ratingChartData} />
          </motion.div>
          
          <motion.div variants={itemVariants} className="overflow-x-auto bg-card-light dark:bg-card-dark shadow-md rounded-lg mt-6">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-750">
                <tr>
                  {['Date', 'Contest Name', 'Rank', 'Rating Change', 'Solved/Total', 'Unsolved'].map(header => (
                     <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-light dark:text-muted-dark uppercase tracking-wider">
                       {header}
                     </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {detailedContestsList.map(contest => {
                  const ratingChange = contest.newRating - contest.oldRating;
                  const problemStatsAvailable = contest.totalProblemsInContest > 0 || (contest.problemsSolved > 0 || contest.problemsUnsolved > 0);
                  const detailError = (contest as any).errorFetchingDetails;

                  return (
                    <tr key={contest.contestId} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${detailError ? 'opacity-70 bg-red-50 dark:bg-red-900/30' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-light dark:text-muted-dark">{formatDate(contest.ratingUpdateTimeSeconds, 'YYYY-MM-DD')}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-light dark:text-text-dark">
                        <a href={`https://codeforces.com/contest/${contest.contestId}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-primary-light">
                          {contest.contestName}
                        </a>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-light dark:text-muted-dark">{contest.rank}</td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${ratingChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {ratingChange >= 0 ? `+${ratingChange}` : ratingChange} ({contest.newRating})
                      </td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-light dark:text-muted-dark">
                        {detailError ? <span className="text-red-500 text-xs">Error</span> : problemStatsAvailable ? `${contest.problemsSolved}/${contest.totalProblemsInContest}`: 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-light dark:text-muted-dark">
                        {detailError ? <span className="text-red-500 text-xs">Error</span> : problemStatsAvailable ? contest.problemsUnsolved : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
                 {/* Placeholder for contests where details haven't been loaded yet */}
                 {filteredContests.filter(fc => !processedContestIds.has(fc.contestId)).slice(0, Math.max(0, CONTEST_DETAILS_BATCH_SIZE - detailedContestsList.filter(dc => !processedContestIds.has(dc.contestId)).length)).map(contest => (
                     <tr key={`${contest.contestId}-loading`} className="opacity-50">
                        <td className="px-4 py-3 text-sm">{formatDate(contest.ratingUpdateTimeSeconds, 'YYYY-MM-DD')}</td>
                        <td className="px-4 py-3 text-sm">
                            <a href={`https://codeforces.com/contest/${contest.contestId}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-primary-light">
                                {contest.contestName}
                            </a>
                        </td>
                        <td className="px-4 py-3 text-sm">{contest.rank}</td>
                        <td className="px-4 py-3 text-sm">...</td>
                        <td className="px-4 py-3 text-sm text-center" colSpan={2}>Loading details...</td>
                    </tr>
                 ))}

              </tbody>
            </table>
          </motion.div>
          {canLoadMoreDetails && !isLoadingMoreDetails && (
            <motion.div variants={itemVariants} className="text-center mt-4">
              <Button 
                onClick={() => fetchNextBatchOfContestDetails(currentForceRefresh)} 
                variant="outline"
                isLoading={isLoadingMoreDetails}
              >
                Load More Details
              </Button>
            </motion.div>
          )}
          {isLoadingMoreDetails && (
            <div className="flex flex-col items-center justify-center py-6">
              <ModernSpinner size={40} />
              <p className="mt-2 text-sm text-muted-light dark:text-muted-dark">Loading more contest details...</p>
              {currentForceRefresh && <p className="text-xs text-yellow-500">Fetching fresh data...</p>}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};