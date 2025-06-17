
import React from 'react';
import { HeatmapDataPoint } from '../../types'; // Corrected path
import { useTheme } from '../../hooks/useTheme'; // Corrected path
import { motion, Variants } from 'framer-motion';
import { formatUTCDateStringToTooltip } from '../../utils/dateHelper'; // Corrected path

interface SubmissionHeatmapProps {
  data: HeatmapDataPoint[];
  daysInFilter: number;
}

const getIntensityColor = (count: number, maxCountForPeriod: number, theme: 'light' | 'dark'): string => {
  if (count === 0) return theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
  
  const scaleMax = Math.max(1, maxCountForPeriod);
  const intensityRatio = count / scaleMax;

  if (theme === 'dark') {
    if (intensityRatio > 0.75) return 'bg-green-400 hover:bg-green-300';
    if (intensityRatio > 0.50) return 'bg-green-500 hover:bg-green-400';
    if (intensityRatio > 0.20) return 'bg-green-600 hover:bg-green-500';
    return 'bg-green-700 hover:bg-green-600';
  } else {
    if (intensityRatio > 0.75) return 'bg-green-600 hover:bg-green-700';
    if (intensityRatio > 0.50) return 'bg-green-500 hover:bg-green-600';
    if (intensityRatio > 0.20) return 'bg-green-400 hover:bg-green-500';
    return 'bg-green-300 hover:bg-green-400';
  }
};

const monthBlockVariants: Variants = {
  hidden: { opacity: 0, x: -20 }, // Changed y to x for horizontal entrance
  visible: {
    opacity: 1,
    x: 0, // Changed y to x
    transition: {
      duration: 0.4,
      ease: "easeOut"
    },
  },
};

const dayLabelTexts = [
  { text: 'Sun', row: 0 }, { text: 'Mon', row: 1 }, { text: 'Tue', row: 2 },
  { text: 'Wed', row: 3 }, { text: 'Thu', row: 4 }, { text: 'Fri', row: 5 },
  { text: 'Sat', row: 6 }
];

interface MonthlyGridData {
  monthLabel: string; // e.g., "August 2024"
  cells: React.ReactNode[];
}

export const SubmissionHeatmap: React.FC<SubmissionHeatmapProps> = ({ data, daysInFilter }) => {
  const { theme } = useTheme();

  const dateMap = new Map<string, number>();
  data.forEach(dp => dateMap.set(dp.date, dp.count));
  const maxCountInPeriod = Math.max(1, ...data.map(d => d.count));

  const monthlyGrids: MonthlyGridData[] = [];

  if (daysInFilter > 0) {
    const today = new Date();
    const endDateUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const startDateUTC = new Date(endDateUTC);
    startDateUTC.setUTCDate(endDateUTC.getUTCDate() - (daysInFilter - 1));

    let currentIterDate = new Date(startDateUTC);
    let currentMonth = -1;
    let currentYear = -1;
    let currentMonthCells: React.ReactNode[] = [];

    while (currentIterDate <= endDateUTC) {
      const iterMonth = currentIterDate.getUTCMonth();
      const iterYear = currentIterDate.getUTCFullYear();

      if (iterMonth !== currentMonth || iterYear !== currentYear) {
        // Finalize previous month if it exists
        if (currentMonthCells.length > 0) {
          monthlyGrids.push({
            monthLabel: new Date(Date.UTC(currentYear, currentMonth, 1)).toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
            cells: currentMonthCells,
          });
        }
        // Start new month
        currentMonth = iterMonth;
        currentYear = iterYear;
        currentMonthCells = [];

        // Add padding for the first day of this month segment
        // The first day we care about for this month grid could be startDateUTC or 1st of month
        const firstDayOfThisMonthGrid = (currentIterDate.getTime() === startDateUTC.getTime()) 
                                          ? new Date(startDateUTC)
                                          : new Date(Date.UTC(currentYear, currentMonth, 1));
        
        const dayOfWeekOffset = firstDayOfThisMonthGrid.getUTCDay(); // 0 for Sunday
        for (let i = 0; i < dayOfWeekOffset; i++) {
          currentMonthCells.push(<div key={`empty-start-${currentYear}-${currentMonth}-${i}`} className="w-3 h-3 rounded-sm"></div>);
        }
      }

      // Add cell for currentIterDate
      const dateString = currentIterDate.toISOString().split('T')[0];
      const count = dateMap.get(dateString) || 0;
      currentMonthCells.push(
        <div
          key={dateString}
          title={`${count} submission${count === 1 ? '' : 's'} on ${formatUTCDateStringToTooltip(dateString)}`}
          className={`w-3 h-3 rounded-sm transition-colors duration-100 ${getIntensityColor(count, maxCountInPeriod, theme)}`}
        />
      );

      currentIterDate.setUTCDate(currentIterDate.getUTCDate() + 1);
    }
    // Add the last month's cells
    if (currentMonthCells.length > 0) {
      monthlyGrids.push({
        monthLabel: new Date(Date.UTC(currentYear, currentMonth, 1)).toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
        cells: currentMonthCells,
      });
    }
  }
  
  const cellSizeRem = 0.75; // for w-3/h-3
  const dayLabelColumnHeight = `calc(7 * ${cellSizeRem}rem + 6 * 1px)`; // 6 gaps of 1px
  const dayLabelColumnWidth = '2rem'; // w-8
  const dayLabelMarginRight = '0.5rem'; // mr-2

  if (daysInFilter <= 0 || monthlyGrids.length === 0) {
    return (
      <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow min-h-[200px] flex flex-col justify-center">
        <h4 className="text-md font-semibold mb-3 text-text-light dark:text-text-dark text-center">Submission Activity (UTC Dates)</h4>
        <p className="text-center text-xs text-muted-light dark:text-muted-dark mt-2">
          {daysInFilter <=0 ? "No date range selected for heatmap." : "No submission data to display for this period."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow">
      <h4 className="text-md font-semibold mb-4 text-text-light dark:text-text-dark">Submission Activity (UTC Dates)</h4>
      
      {/* Container for monthly blocks: changed to horizontal flex layout with scroll */}
      <div className="flex flex-row space-x-6 overflow-x-auto py-2 min-h-[calc(7*0.75rem+6px+2rem)]"> {/* Added min-h for consistent height */}
        {monthlyGrids.map((monthGrid, index) => (
          <motion.div 
            key={monthGrid.monthLabel}
            variants={monthBlockVariants}
            initial="hidden"
            animate="visible"
            className="flex-shrink-0" // Prevent shrinking to fit
          >
            <p className="text-sm font-medium text-text-light dark:text-text-dark mb-2 whitespace-nowrap">{monthGrid.monthLabel}</p>
            <div className="flex">
              {/* Day Labels for this month */}
              <div 
                className="flex flex-col text-xs text-muted-light dark:text-muted-dark shrink-0" 
                style={{ height: dayLabelColumnHeight, width: dayLabelColumnWidth, marginRight: dayLabelMarginRight }}
              >
                {Array(7).fill(null).map((_, rowIndex) => {
                  const dayLabel = dayLabelTexts.find(d => d.row === rowIndex);
                  return (
                    <div 
                      key={`day-label-${monthGrid.monthLabel}-${rowIndex}`}
                      className="flex-1 flex items-center justify-end pr-1"
                      style={{ height: `${cellSizeRem}rem`}} 
                    >
                      {dayLabel ? dayLabel.text : ''}
                    </div>
                  );
                })}
              </div>

              {/* Heatmap Cells Grid for this month */}
              <div className="grid grid-flow-col grid-rows-7 gap-px">
                {monthGrid.cells}
              </div >
            </div>
          </motion.div>
        ))}
      </div>
       
      <div className="flex justify-end items-center mt-6 space-x-1 text-xs text-muted-light dark:text-muted-dark">
        <span>Less</span>
        <div className={`w-2.5 h-2.5 rounded-sm ${getIntensityColor(0, maxCountInPeriod, theme).split(' ')[0]}`}></div>
        <div className={`w-2.5 h-2.5 rounded-sm ${getIntensityColor(Math.ceil(maxCountInPeriod*0.25), maxCountInPeriod, theme).split(' ')[0]}`}></div>
        <div className={`w-2.5 h-2.5 rounded-sm ${getIntensityColor(Math.ceil(maxCountInPeriod*0.50), maxCountInPeriod, theme).split(' ')[0]}`}></div>
        <div className={`w-2.5 h-2.5 rounded-sm ${getIntensityColor(Math.ceil(maxCountInPeriod*0.75), maxCountInPeriod, theme).split(' ')[0]}`}></div>
        <div className={`w-2.5 h-2.5 rounded-sm ${getIntensityColor(maxCountInPeriod, maxCountInPeriod, theme).split(' ')[0]}`}></div>
        <span>More</span>
      </div>
    </div>
  );
};
