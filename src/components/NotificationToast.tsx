import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Notification } from '../contexts/NotificationContext';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ 
  notification, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoClose) {
      // Start progress bar
      const startTime = Date.now();
      const endTime = startTime + duration;
      
      const id = setInterval(() => {
        const now = Date.now();
        const remaining = endTime - now;
        const percentage = (remaining / duration) * 100;
        
        if (percentage <= 0) {
          clearInterval(id);
          setIsVisible(false);
          setTimeout(onClose, 300); // Allow time for exit animation
        } else {
          setProgress(percentage);
        }
      }, 100);
      
      setIntervalId(id);
      
      return () => {
        if (id) clearInterval(id);
      };
    }
  }, [autoClose, duration, onClose]);

  const handleClose = () => {
    if (intervalId) clearInterval(intervalId);
    setIsVisible(false);
    setTimeout(onClose, 300); // Allow time for exit animation
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getProgressColor = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-600 dark:bg-green-400';
      case 'warning': return 'bg-amber-600 dark:bg-amber-400';
      case 'error': return 'bg-red-600 dark:bg-red-400';
      case 'info':
      default: return 'bg-blue-600 dark:bg-blue-400';
    }
  };

  return (
    <div 
      className={`max-w-sm w-full border rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${getTypeStyles()} ${
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {notification.title}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {notification.message}
            </p>
            {notification.link && (
              <a 
                href={notification.link} 
                className="mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View details
              </a>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      {autoClose && (
        <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
          <div 
            className={`h-full ${getProgressColor()} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationToast;