import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Clock, FileText, Code, GitBranch, Cpu, BarChart3, Eye, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ScrollableContainer from './ScrollableContainer';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
  link?: string;
  icon?: React.ReactNode;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Load notifications on mount
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Load notifications from localStorage
  const loadNotifications = () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      // For demo, we'll use localStorage and generate some sample notifications
      const savedNotifications = localStorage.getItem('codeoscope-notifications');
      
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      } else {
        // Generate sample notifications for demo
        const sampleNotifications = generateSampleNotifications();
        setNotifications(sampleNotifications);
        localStorage.setItem('codeoscope-notifications', JSON.stringify(sampleNotifications));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate sample notifications for demo
  const generateSampleNotifications = (): Notification[] => {
    const now = Date.now();
    return [
      {
        id: 'notif-1',
        title: 'Analysis Complete',
        message: 'Your code analysis for "React E-commerce App" is ready to view.',
        type: 'success',
        timestamp: now - 1000 * 60 * 5, // 5 minutes ago
        read: false,
        icon: <BarChart3 className="w-4 h-4" />
      },
      {
        id: 'notif-2',
        title: 'New Feature Available',
        message: 'Try our new architecture visualization tools for better code insights.',
        type: 'info',
        timestamp: now - 1000 * 60 * 60 * 2, // 2 hours ago
        read: true,
        icon: <GitBranch className="w-4 h-4" />
      },
      {
        id: 'notif-3',
        title: 'Welcome to Codeoscope',
        message: 'Get started by uploading your first project or exploring our demo repository.',
        type: 'info',
        timestamp: now - 1000 * 60 * 60 * 24, // 1 day ago
        read: true,
        icon: <Code className="w-4 h-4" />
      },
      {
        id: 'notif-4',
        title: 'Email Verification Reminder',
        message: 'Please verify your email address to access all features.',
        type: 'warning',
        timestamp: now - 1000 * 60 * 30, // 30 minutes ago
        read: false,
        icon: <AlertCircle className="w-4 h-4" />
      },
      {
        id: 'notif-5',
        title: 'Architecture Analysis Ready',
        message: 'Your system architecture diagram for PX4-Autopilot has been generated.',
        type: 'success',
        timestamp: now - 1000 * 60 * 120, // 2 hours ago
        read: false,
        icon: <Cpu className="w-4 h-4" />
      }
    ];
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    
    setNotifications(updatedNotifications);
    localStorage.setItem('codeoscope-notifications', JSON.stringify(updatedNotifications));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
    setNotifications(updatedNotifications);
    localStorage.setItem('codeoscope-notifications', JSON.stringify(updatedNotifications));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('codeoscope-notifications', JSON.stringify([]));
  };

  // Delete a specific notification
  const deleteNotification = (id: string) => {
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    setNotifications(updatedNotifications);
    localStorage.setItem('codeoscope-notifications', JSON.stringify(updatedNotifications));
  };

  // Get filtered notifications
  const getFilteredNotifications = () => {
    if (filter === 'unread') {
      return notifications.filter(notification => !notification.read);
    }
    return notifications;
  };

  // Get notification type styles
  const getNotificationTypeStyles = (type: Notification['type']) => {
    switch (type) {
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

  // Get notification icon
  const getNotificationIcon = (notification: Notification) => {
    if (notification.icon) return notification.icon;
    
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

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return new Date(timestamp).toLocaleDateString();
  };

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Filtered notifications
  const filteredNotifications = getFilteredNotifications();

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
      style={{ top: '100%', right: '0' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'No new notifications'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark all read
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Unread
        </button>
      </div>

      {/* Notification List */}
      <ScrollableContainer className="max-h-96">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-1 rounded-full ${
                    notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                    notification.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' :
                    notification.type === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {getNotificationIcon(notification)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className={`font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2 ml-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {notification.message}
                    </p>
                    {notification.link && (
                      <a 
                        href={notification.link}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View details
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="text-gray-900 dark:text-white font-medium mb-1">No notifications</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filter === 'all' 
                ? 'You don\'t have any notifications yet' 
                : 'You don\'t have any unread notifications'}
            </p>
          </div>
        )}
      </ScrollableContainer>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
          <button
            onClick={clearAllNotifications}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center space-x-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear all</span>
          </button>
          <button
            onClick={onClose}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;