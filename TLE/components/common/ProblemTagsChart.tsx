import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, RectangleProps } from 'recharts';
import { useTheme } from '../../hooks/useTheme'; // Corrected path

export interface ProblemTagDataPoint {
  tagName: string;
  count: number;
}

interface ProblemTagsChartProps {
  data: ProblemTagDataPoint[];
}

// Custom Active Bar Component for horizontal chart
interface CustomActiveHorizontalBarProps extends RectangleProps {
  fillOpacity?: number;
}
const CustomActiveHorizontalBar: React.FC<CustomActiveHorizontalBarProps> = (props) => {
  const { fill, x, y, width, height } = props;
  return <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.8} />;
};

export const ProblemTagsChart: React.FC<ProblemTagsChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const strokeColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
  const gridColor = theme === 'dark' ? '#2D3748' : '#E2E8F0';
  const labelColor = theme === 'dark' ? '#E2E8F0' : '#2D3748';

  const gradientStartColor = theme === 'dark' ? '#50E3C2' : '#38B2AC'; // secondary.light / secondary.default
  const gradientEndColor = theme === 'dark' ? '#38B2AC' : '#2C7A7B';   // secondary.default / secondary.dark

  if (!data || data.length === 0) {
    return (
      <div className="h-96 w-full bg-card-light dark:bg-card-dark p-4 rounded-lg shadow flex flex-col items-center justify-center"> {/* Use h-96 and flex for centering */}
        <h4 className="text-md font-semibold mb-3 text-text-light dark:text-text-dark text-center">
          Top Solved Problem Tags
        </h4>
        <p className="text-center text-muted-light dark:text-muted-dark flex-grow flex items-center justify-center">
          No tag data to display for solved problems in this period.
        </p>
      </div>
    );
  }
  
  const maxTagCount = Math.max(...data.map(item => item.count), 0);

  return (
    <div className="h-96 w-full bg-card-light dark:bg-card-dark p-4 rounded-lg shadow flex flex-col"> {/* Added flex flex-col */}
      <h4 className="text-md font-semibold mb-3 text-text-light dark:text-text-dark text-center flex-shrink-0"> {/* flex-shrink-0 for title */}
        Top Solved Problem Tags
      </h4>
      <div className="flex-grow min-h-0"> {/* Added wrapper with flex-grow and min-h-0 */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 35, left: 20, bottom: 5 }} // Increased right margin for LabelList
          >
            <defs>
              <linearGradient id="tagBarGradient" x1="0" y1="0" x2="1" y2="0"> {/* Horizontal gradient */}
                <stop offset="5%" stopColor={gradientStartColor} stopOpacity={0.9}/>
                <stop offset="95%" stopColor={gradientEndColor} stopOpacity={0.8}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            <XAxis
              type="number"
              stroke={strokeColor}
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: strokeColor, strokeWidth: 0.5 }}
              allowDecimals={false}
              domain={[0, maxTagCount > 0 ? 'auto' : 1]}
            />
            <YAxis
              type="category"
              dataKey="tagName"
              stroke={strokeColor}
              tick={{ fontSize: 10, width: 80 }} 
              width={85} // Slightly increased width for Y-axis labels
              axisLine={{ stroke: strokeColor, strokeWidth: 0.5 }}
              tickLine={false}
              interval={0} // Ensure all tags are shown if they fit
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
            <Bar
              dataKey="count"
              name="Problems Solved"
              radius={[0, 4, 4, 0]} // Rounded right corners
              fill="url(#tagBarGradient)"
              activeBar={<CustomActiveHorizontalBar />}
              maxBarSize={20} // Slightly reduced for a denser look if many tags
            >
              <LabelList
                dataKey="count"
                position="right"
                offset={5}
                formatter={(value: number) => (value > 0 ? value : '')}
                style={{ fill: labelColor, fontSize: '11px', fontWeight: 500 }} // Increased font size
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};