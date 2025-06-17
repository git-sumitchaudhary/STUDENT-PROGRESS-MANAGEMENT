import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, Variants } from 'framer-motion';
import { CFSubmission, TimeFilterOption, Student, ProblemCountDataPoint, HeatmapDataPoint, CFProblem } from '../types'; 
import { getUserSubmissions } from '../services_backend/codeforcesService'; 
import { ProblemBarChart } from './common/ProblemBarChart'; 
import { SubmissionHeatmap } from './common/SubmissionHeatmap'; 
import { ProblemTagsChart, ProblemTagDataPoint } from './common/ProblemTagsChart'; // New import
import { Button } from './common/Button'; 
import { TIME_FILTER_OPTIONS_PROBLEMS, PROBLEM_RATING_BUCKETS } from '../constants'; 
import { getDaysAgoDate, isDateAfter, getUTCDateYYYYMMDD } from '../utils/dateHelper'; // added getUTCDateYYYYMMDD
import { ModernSpinner } from './common/ModernSpinner'; 

interface ProblemSolvingSectionProps {
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

const statCardContainerVariants: Variants = {
  hidden: { opacity: 1 }, // Parent doesn't hide, children do
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Stagger animation of child StatCards
    },
  },
};

const MAX_TAGS_TO_DISPLAY = 10;


export const ProblemSolvingSection: React.FC<ProblemSolvingSectionProps> = ({ student, forceRefreshTrigger = 0 }) => {
  const [filter, setFilter] = useState<string>(TimeFilterOption.LAST_30_DAYS);
  const [submissions, setSubmissions] = useState<CFSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentForceRefresh, setCurrentForceRefresh] = useState(false);

  useEffect(() => {
    if (forceRefreshTrigger > 0) {
      setCurrentForceRefresh(true);
    }
  }, [forceRefreshTrigger]);

  const fetchSubmissions = useCallback(async (isForced: boolean) => {
    if (!student.codeforcesHandle) return;
    setIsLoading(true);
    setError(null);
    try {
      const userSubmissions = await getUserSubmissions(student.codeforcesHandle, 3000, isForced); 
      setSubmissions(userSubmissions);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
      const msg = err instanceof Error ? err.message : 'Failed to load submission data.';
      setError(msg);
      setSubmissions([]); 
    }
    setIsLoading(false);
    if (isForced) setCurrentForceRefresh(false); 
  }, [student.codeforcesHandle]);

  useEffect(() => {
    fetchSubmissions(currentForceRefresh);
  }, [fetchSubmissions, currentForceRefresh]);


  const selectedFilterOption = useMemo(() => TIME_FILTER_OPTIONS_PROBLEMS.find(opt => opt.value === filter), [filter]);
  const daysInFilter = selectedFilterOption?.days ?? 30;

  const filteredSubmissions = useMemo(() => {
    if (!selectedFilterOption) return [];
    const cutoffDate = getDaysAgoDate(selectedFilterOption.days); // This uses local date for filtering
    return submissions.filter(sub => isDateAfter(new Date(sub.creationTimeSeconds * 1000), cutoffDate));
  }, [submissions, selectedFilterOption]);

  const solvedProblems = useMemo(() => {
    const solved = filteredSubmissions.filter(sub => sub.verdict === 'OK');
    const uniqueSolvedProblems = new Map<string, CFProblem>();
    solved.forEach(sub => {
      const problemId = `${sub.problem.contestId || 'gym'}-${sub.problem.index}`; 
      if (!uniqueSolvedProblems.has(problemId) || (sub.problem.rating && (!uniqueSolvedProblems.get(problemId)?.rating || sub.problem.rating! > uniqueSolvedProblems.get(problemId)!.rating!))) {
         uniqueSolvedProblems.set(problemId, sub.problem);
      }
    });
    return Array.from(uniqueSolvedProblems.values());
  }, [filteredSubmissions]);

  const stats = useMemo(() => {
    if (solvedProblems.length === 0) {
      return { mostDifficult: null, totalSolved: 0, avgRating: 0, avgPerDay: 0 };
    }
    const ratedProblems = solvedProblems.filter(p => p.rating !== undefined && p.rating !== null);
    const mostDifficult = ratedProblems.length > 0 ? Math.max(...ratedProblems.map(p => p.rating!)) : null;
    const totalSolved = solvedProblems.length;
    const avgRating = ratedProblems.length > 0 ? Math.round(ratedProblems.reduce((sum, p) => sum + p.rating!, 0) / ratedProblems.length) : 0;
    const avgPerDay = parseFloat((totalSolved / daysInFilter).toFixed(2));
    
    return { mostDifficult, totalSolved, avgRating, avgPerDay };
  }, [solvedProblems, daysInFilter]);

  const problemRatingData: ProblemCountDataPoint[] = useMemo(() => {
    const buckets = PROBLEM_RATING_BUCKETS;
    const counts: { [key: string]: number } = {};

    solvedProblems.forEach(p => {
      if (p.rating === undefined || p.rating === null) return;
      for (let i = 0; i < buckets.length -1; i++) {
        if (p.rating >= buckets[i] && p.rating < buckets[i+1]) {
          const bucketName = `${buckets[i]}-${buckets[i+1]-1}`;
          counts[bucketName] = (counts[bucketName] || 0) + 1;
          return;
        }
      }
      if (p.rating >= buckets[buckets.length - 1]) {
        const bucketName = `${buckets[buckets.length - 1]}+`;
        counts[bucketName] = (counts[bucketName] || 0) + 1;
      }
    });

    // Ensure all buckets are present for a consistent X-axis
    const dataPoints: ProblemCountDataPoint[] = [];
    for (let i = 0; i < buckets.length -1; i++) {
        const bucketName = `${buckets[i]}-${buckets[i+1]-1}`;
        dataPoints.push({ ratingBucket: bucketName, count: counts[bucketName] || 0 });
    }
    const lastBucketName = `${buckets[buckets.length - 1]}+`;
    dataPoints.push({ ratingBucket: lastBucketName, count: counts[lastBucketName] || 0 });
    
    return dataPoints;
  }, [solvedProblems]);

  const heatmapData: HeatmapDataPoint[] = useMemo(() => {
    const countsByDate: { [date: string]: number } = {};
    filteredSubmissions.forEach(sub => {
      const dateStr = getUTCDateYYYYMMDD(sub.creationTimeSeconds);
      countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    });
    return Object.entries(countsByDate).map(([date, count]) => ({ date, count }));
  }, [filteredSubmissions]);

  const problemTagsData: ProblemTagDataPoint[] = useMemo(() => {
    const tagCounts: { [tag: string]: number } = {};
    solvedProblems.forEach(problem => {
      problem.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .map(([tagName, count]) => ({ tagName, count }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .slice(0, MAX_TAGS_TO_DISPLAY);     // Take top N tags
  }, [solvedProblems]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <ModernSpinner size={60} />
        <p className="mt-3 text-muted-light dark:text-muted-dark">Loading problem solving data for {student.codeforcesHandle}...</p>
        {currentForceRefresh && <p className="text-sm text-yellow-500">Fetching fresh data...</p>}
      </div>
    );
  }

  if (error) {
    return <motion.div variants={itemVariants} className="p-4 bg-red-100 text-red-700 rounded-md dark:bg-red-800 dark:text-red-200">{error}</motion.div>;
  }
  
  const StatCard: React.FC<{title: string, value: string | number | null}> = ({title, value}) => (
    <motion.div 
      variants={itemVariants}
      className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow text-center transition-all hover:shadow-md"
    >
        <h4 className="text-sm font-medium text-muted-light dark:text-muted-dark">{title}</h4>
        <p className="text-2xl font-semibold text-primary dark:text-primary-light mt-1">{value ?? 'N/A'}</p>
    </motion.div>
  );

  return (
    <motion.div 
      className="space-y-6"
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center">
        <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2 sm:mb-0">Problem Solving Data</h3>
        <div className="flex space-x-2">
          {TIME_FILTER_OPTIONS_PROBLEMS.map(opt => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(opt.value)}
              disabled={isLoading}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </motion.div>
      
      {(submissions.length === 0 && !isLoading && !error) ? (
          <motion.p variants={itemVariants} className="text-center text-muted-light dark:text-muted-dark py-4">No submissions found for this student.</motion.p>
      ) : filteredSubmissions.length === 0 && !isLoading && !error && submissions.length > 0 ? (
          <motion.p variants={itemVariants} className="text-center text-muted-light dark:text-muted-dark py-4">No submissions found for the selected period.</motion.p>
      ): (
        <>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={statCardContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <StatCard title="Most Difficult Solved" value={stats.mostDifficult} />
            <StatCard title="Total Problems Solved" value={stats.totalSolved} />
            <StatCard title="Avg. Problem Rating" value={stats.avgRating > 0 ? stats.avgRating : 'N/A'} />
            <StatCard title="Avg. Problems/Day" value={stats.avgPerDay} />
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            variants={itemVariants}
          >
            <ProblemBarChart data={problemRatingData} />
            <SubmissionHeatmap data={heatmapData} daysInFilter={daysInFilter}/>
          </motion.div>

          {/* Always render the container for ProblemTagsChart; the component itself handles "no data" */}
          <motion.div variants={itemVariants} className="mt-6">
              <ProblemTagsChart data={problemTagsData} />
          </motion.div>
        </>
      )}
    </motion.div>
  );
};