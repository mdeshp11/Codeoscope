import React, { useState, useEffect } from 'react';
import NotificationToast from './NotificationToast';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationToastContainer: React.FC = () => {
  const { notifications, markAsRead } = useNotifications();
  const [visibleToasts, setVisibleToasts] = useState<string[]>([]);

  // Show new notifications as toasts
  useEffect(() => {
    // Find new unread notifications that aren't already being shown
    const newNotifications = notifications
      .filter(notification => !notification.read && !visibleToasts.includes(notification.id))
      .slice(0, 3); // Limit to 3 at a time
    
    if (newNotifications.length > 0) {
      setVisibleToasts(prev => [
        ...prev,
        ...newNotifications.map(notification => notification.id)
      ]);
    }
  }, [notifications, visibleToasts]);

  const handleCloseToast = (id: string) => {
    setVisibleToasts(prev => prev.filter(toastId => toastId !== id));
    markAsRead(id);
  };

  // Get notifications that should be visible as toasts
  const toastsToShow = notifications.filter(notification => 
    visibleToasts.includes(notification.id)
  );

  if (toastsToShow.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4 pointer-events-none">
      {toastsToShow.map(notification => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationToast
            notification={notification}
            onClose={() => handleCloseToast(notification.id)}
            autoClose={true}
            duration={6000}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationToastContainer;