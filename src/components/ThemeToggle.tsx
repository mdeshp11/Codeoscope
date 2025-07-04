import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        relative rounded-lg
        bg-gray-100 hover:bg-gray-200 
        dark:bg-gray-700 dark:hover:bg-gray-600
        border border-gray-300 dark:border-gray-600
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-800
        group overflow-hidden
        ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-pressed={theme === 'dark'}
      role="switch"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Background gradient animation */}
      <div className={`
        absolute inset-0 transition-all duration-500 ease-in-out
        ${theme === 'light' 
          ? 'bg-gradient-to-br from-yellow-100 to-orange-100' 
          : 'bg-gradient-to-br from-blue-900 to-purple-900'
        }
      `} />
      
      {/* Icon container */}
      <div className="relative z-10 flex items-center justify-center h-full">
        {/* Sun icon */}
        <Sun 
          className={`
            ${iconSizes[size]}
            absolute transition-all duration-500 ease-in-out
            text-yellow-600 dark:text-yellow-400
            ${theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-180 scale-75'
            }
          `}
        />
        
        {/* Moon icon */}
        <Moon 
          className={`
            ${iconSizes[size]}
            absolute transition-all duration-500 ease-in-out
            text-blue-600 dark:text-blue-300
            ${theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-180 scale-75'
            }
          `}
        />
      </div>
      
      {/* Hover effect overlay */}
      <div className="
        absolute inset-0 opacity-0 group-hover:opacity-10 
        bg-white dark:bg-black
        transition-opacity duration-200
      " />
    </button>
  );
};

export default ThemeToggle;