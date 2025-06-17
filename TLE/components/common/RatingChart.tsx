import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RatingDataPoint } from '../../types'; // Corrected path
import { useTheme } from '../../hooks/useTheme'; // Corrected path

interface RatingChartProps {
  data: RatingDataPoint[];
}

export const RatingChart: React.FC<RatingChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const strokeColor = theme === 'dark' ? '#A0AEC0' : '#4A5568'; // Muted text color
  const gridColor = theme === 'dark' ? '#2D3748' : '#E2E8F0'; // Card dark / lighter gray
  const lineStrokeColor = '#2563EB'; // Updated to new primary.DEFAULT light blue

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-light dark:text-muted-dark py-4">No rating data available for the selected period.</p>;
  }
  
  // Find min/max rating for Y-axis domain to make graph more readable
  const ratings = data.map(d => d.rating);
  const minY = Math.min(...ratings);
  const maxY = Math.max(...ratings);
  const yDomainPadding = Math.max(50, (maxY - minY) * 0.1); // Add some padding

  return (
    <div className="h-80 w-full bg-card-light dark:bg-card-dark p-4 rounded-lg shadow">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="date" 
            stroke={strokeColor} 
            tick={{ fontSize: 12 }} 
            angle={-30} 
            textAnchor="end"
            height={50}
          />
          <YAxis 
            stroke={strokeColor} 
            tick={{ fontSize: 12 }}
            domain={[Math.max(0, minY - yDomainPadding), maxY + yDomainPadding]}
            allowDataOverflow={true}
          />
          <Tooltip
            contentStyle={{ 
                backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', // background dark / white
                borderColor: theme === 'dark' ? '#4A5568' : '#CBD5E0', // Muted text / gray-400
            }}
            labelStyle={{ color: theme === 'dark' ? '#E2E8F0' : '#2D3748' }} // Text dark / light
            itemStyle={{ color: theme === 'dark' ? '#E2E8F0' : '#2D3748' }}
            formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.contestName})`, "Rating"]}
          />
          <Legend wrapperStyle={{ color: strokeColor, fontSize: '12px', paddingTop: '10px' }} />
          <Line type="monotone" dataKey="rating" stroke={lineStrokeColor} strokeWidth={2} activeDot={{ r: 6 }} dot={{r:3}} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};