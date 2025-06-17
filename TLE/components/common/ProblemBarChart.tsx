
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, RectangleProps } from 'recharts';
import { ProblemCountDataPoint } from '../../types'; // Corrected path
import { useTheme } from '../../hooks/useTheme'; // Corrected path

interface ProblemBarChartProps {
  data: ProblemCountDataPoint[];
}

// Custom Active Bar Component
interface CustomActiveBarProps extends RectangleProps {
  fillOpacity?: number;
}

const CustomActiveBar: React.FC<CustomActiveBarProps> = (props) => {
  const { fill, x, y, width, height } = props;
  // Make active bar slightly brighter or add an outline effect
  return <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.8} />;
};


export const ProblemBarChart: React.FC<ProblemBarChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const strokeColor = theme === 'dark' ? '#A0AEC0' : '#4A5568'; // Muted text for axes
  const gridColor = theme === 'dark' ? '#2D3748' : '#E2E8F0'; // Subtle grid
  const labelColor = theme === 'dark' ? '#E2E8F0' : '#2D3748'; // Text color for labels

  // Define gradient colors (using primary theme color now)
  const gradientStartColor = theme === 'dark' ? '#2563EB' : '#3B82F6'; // primary.DEFAULT / primary.light
  const gradientEndColor = theme === 'dark' ? '#1D4ED8' : '#2563EB';   // primary.dark / primary.DEFAULT


  // This check is effectively bypassed because ProblemSolvingSection always provides full bucket data
  // if (!data || data.length === 0) {
  //   return (
  //     <div className="h-80 w-full bg-card-light dark:bg-card-dark p-4 rounded-lg shadow flex items-center justify-center">
  //       <p className="text-center text-muted-light dark:text-muted-dark">No problem data available for the selected period.</p>
  //     </div>
  //   );
  // }
  
  const maxYValue = Math.max(...data.map(item => item.count), 0);
  const allCountsZero = data.every(item => item.count === 0);

  return (
    <div className="h-80 w-full bg-card-light dark:bg-card-dark p-4 rounded-lg shadow flex flex-col">
       <h4 className="text-md font-semibold mb-3 text-text-light dark:text-text-dark text-center flex-shrink-0">
        Problems Solved by Rating
      </h4>
      {allCountsZero && !data.some(item => item.count > 0) ? ( // Added check to ensure this message only shows if truly all are zero.
         <div className="flex-grow flex items-center justify-center">
            <p className="text-center text-muted-light dark:text-muted-dark">
                No problems solved in these rating categories for the selected period.
            </p>
         </div>
      ) : (
        <div className="flex-grow min-h-0"> {/* Added min-h-0 for flex-grow to work correctly with ResponsiveContainer */}
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                <defs>
                    <linearGradient id="barGradientInfographic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={gradientStartColor} stopOpacity={0.9}/>
                    <stop offset="95%" stopColor={gradientEndColor} stopOpacity={0.8}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis 
                    dataKey="ratingBucket" 
                    stroke={strokeColor} 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={{ stroke: strokeColor, strokeWidth: 0.5 }}
                />
                <YAxis 
                    label={{ value: 'Number of Problems', angle: -90, position: 'insideLeft', fill: strokeColor, fontSize: 10, dy: 40 }}
                    stroke={strokeColor} 
                    tick={{ fontSize: 10 }} 
                    allowDecimals={false} 
                    axisLine={{ stroke: strokeColor, strokeWidth: 0.5 }}
                    domain={[0, maxYValue > 0 ? 'auto' : 5]} // Ensure Y-axis shows a small range even if all counts are 0
                    tickCount={maxYValue > 0 && maxYValue < 5 ? maxYValue + 1 : undefined} // More ticks for small numbers
                />
                <Tooltip
                    cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                    contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#2D3748' : '#FFFFFF', 
                        borderColor: theme === 'dark' ? '#4A5568' : '#CBD5E0', 
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    labelStyle={{ color: labelColor, fontWeight: 'bold', marginBottom: '4px' }}
                    itemStyle={{ color: labelColor }}
                />
                {/* Removed Legend to reduce clutter, title and axes should be clear */}
                <Bar
                    dataKey="count"
                    name="Problems Solved"
                    radius={[4, 4, 0, 0]}
                    fill="url(#barGradientInfographic)" // Ensure unique ID if other charts use similar gradient ID
                    activeBar={<CustomActiveBar />}
                    maxBarSize={40}
                >
                    <React.Fragment>
                    <LabelList
                        dataKey="count"
                        position="top"
                        offset={5}
                        formatter={(value: number) => (value > 0 ? value : '')}
                        style={{ fill: labelColor, fontSize: '11px', fontWeight: 'bold' }}
                    />
                    </React.Fragment>
                </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
