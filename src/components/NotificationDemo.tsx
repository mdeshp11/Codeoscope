import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Code, GitBranch, Cpu, BarChart3, AlertCircle, CheckCircle, Info } from 'lucide-react';

const NotificationDemo: React.FC = () => {
  const { addNotification } = useNotifications();

  const sendDemoNotification = (type: 'info' | 'success' | 'warning' | 'error') => {
    const notifications = {
      info: {
        title: 'New Feature Available',
        message: 'Try our new architecture visualization tools for better code insights.',
        icon: <GitBranch className="w-4 h-4" />
      },
      success: {
        title: 'Analysis Complete',
        message: 'Your code analysis is ready to view.',
        icon: <BarChart3 className="w-4 h-4" />
      },
      warning: {
        title: 'Large Repository Detected',
        message: 'This repository is quite large and may take longer to analyze.',
        icon: <AlertCircle className="w-4 h-4" />
      },
      error: {
        title: 'Analysis Failed',
        message: 'We encountered an error while analyzing your code. Please try again.',
        icon: <AlertCircle className="w-4 h-4" />
      }
    };

    addNotification({
      ...notifications[type],
      type,
      link: type === 'success' ? '#view-analysis' : undefined
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Test Notifications
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Send yourself a test notification to see how they appear
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => sendDemoNotification('info')}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 rounded-lg transition-colors"
        >
          <Info className="w-4 h-4" />
          <span>Info</span>
        </button>
        <button
          onClick={() => sendDemoNotification('success')}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-200 rounded-lg transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Success</span>
        </button>
        <button
          onClick={() => sendDemoNotification('warning')}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-200 rounded-lg transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Warning</span>
        </button>
        <button
          onClick={() => sendDemoNotification('error')}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-200 rounded-lg transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Error</span>
        </button>
      </div>
    </div>
  );
};

export default NotificationDemo;