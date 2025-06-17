
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme'; // Corrected path to hooks

interface ModernSpinnerProps {
  size?: number;
  className?: string;
  color?: string; // Overrides theme color if provided
}

export const ModernSpinner: React.FC<ModernSpinnerProps> = ({
  size = 40,
  className = '',
  color,
}) => {
  const { theme } = useTheme();
  // Tailwind primary colors: primary.DEFAULT for light, primary-light for dark backgrounds for better contrast
  const themedColor = color || (theme === 'dark' ? 'text-primary-light' : 'text-primary');

  // Determine actual hex color for SVG stroke from Tailwind classes
  // This is a simplified way; in a real app, you might get computed style or have these in JS constants.
  let strokeColor = '#2563EB'; // Default primary blue
  if (!color) {
    strokeColor = theme === 'dark' ? '#3B82F6' : '#2563EB'; // primary-light for dark, primary for light
  } else {
  
    strokeColor = color;
  }


  return (
    <motion.svg
      className={`transform origin-center ${className}`}
      width={size}
      height={size}
      viewBox="0 0 50 50"
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{
        repeat: Infinity,
        ease: 'linear',
        duration: 1,
      }}
    >
      <motion.circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={strokeColor} // Use resolved stroke color
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="30 150" // Creates an arc effect; adjust values for different arc lengths
        initial={{ pathLength: 0.2, opacity: 0 }}
        animate={{ pathLength: 0.6, opacity: 1 }}
        transition={{
            pathLength: { duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
            opacity: {duration: 0.5}
        }}
      />
    </motion.svg>
  );
};