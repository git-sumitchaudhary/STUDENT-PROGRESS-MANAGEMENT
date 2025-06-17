
import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion'; // Import HTMLMotionProps

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = (props) => {
  const {
    children,
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    isLoading = false,
    className = '',
    onAnimationStart, // Destructured to remove React's version from rest, if conflicting
    ...rest // Contains remaining React.ButtonHTMLAttributes
  } = props;

  const baseStyles = "font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-background-dark transition-all duration-150 ease-in-out inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantStyles = {
    primary: 'bg-primary hover:bg-primary-dark focus:ring-primary-light text-white',
    secondary: 'bg-secondary hover:bg-secondary-dark focus:ring-secondary-light text-white',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    outline: 'border border-primary text-primary hover:bg-primary/10 focus:ring-primary-light dark:border-primary-light dark:text-primary-light dark:hover:bg-primary-light/20',
    ghost: 'text-primary hover:bg-primary/10 focus:ring-primary-light dark:text-primary-light dark:hover:bg-primary-light/20',
  };

  return (
    <motion.button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={isLoading || props.disabled} // Use props.disabled for clarity
      whileHover={!props.disabled && !isLoading ? { scale: 1.05, transition: { duration: 0.15 } } : {}}
      whileTap={!props.disabled && !isLoading ? { scale: 0.95 } : {}}
      // Cast 'rest' props for compatibility with HTMLMotionProps
      {...(rest as any as HTMLMotionProps<"button">)}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
    </motion.button>
  );
};
