import React, { useState } from 'react';
import { Bell, Volume2, VolumeX, Clock, Zap, Shield, LampDesk as Desktop, File as Mobile, X, Info, Mail } from 'lucide-react';
import NotificationPreferences from './NotificationPreferences';
import NotificationDemo from './NotificationDemo';
import ScrollableContainer from './ScrollableContainer';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preferences' | 'delivery' | 'test'>('preferences');
  const [browserNotifications, setBrowserNotifications] = useState(() => {
    return localStorage.getItem('codeoscope-browser-notifications') === 'true';
  });
  const [desktopNotifications, setDesktopNotifications] = useState(() => {
    return localStorage.getItem('codeoscope-desktop-notifications') === 'true';
  });
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem('codeoscope-email-notifications') === 'true';
  });

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      setBrowserNotifications(true);
      localStorage.setItem('codeoscope-browser-notifications', 'true');
      return;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setBrowserNotifications(true);
        localStorage.setItem('codeoscope-browser-notifications', 'true');
        
        // Send a test notification
        new Notification('Notifications Enabled', {
          body: 'You will now receive notifications from Codeoscope',
          icon: '/favicon.ico'
        });
      }
    } else {
      alert('Notification permission was denied. Please enable notifications in your browser settings.');
    }
  };

  const toggleBrowserNotifications = async () => {
    if (!browserNotifications) {
      await requestBrowserPermission();
    } else {
      setBrowserNotifications(false);
      localStorage.setItem('codeoscope-browser-notifications', 'false');
    }
  };

  const toggleDesktopNotifications = () => {
    setDesktopNotifications(!desktopNotifications);
    localStorage.setItem('codeoscope-desktop-notifications', String(!desktopNotifications));
  };

  const toggleEmailNotifications = () => {
    setEmailNotifications(!emailNotifications);
    localStorage.setItem('codeoscope-email-notifications', String(!emailNotifications));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Notification Settings</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage how and when you receive notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'preferences'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notification Types</span>
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'delivery'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Desktop className="w-4 h-4" />
            <span>Delivery Methods</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'test'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Test Notifications</span>
          </button>
        </div>

        {/* Content */}
        <ScrollableContainer className="flex-1 p-6">
          {activeTab === 'preferences' && (
            <NotificationPreferences onClose={() => {}} />
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delivery Methods</h3>
                
                {/* Browser Notifications */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Desktop className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Browser Notifications</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Show notifications in your browser even when the app is in the background
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {Notification.permission === 'granted' 
                            ? 'Permission granted' 
                            : Notification.permission === 'denied'
                            ? 'Permission denied. Please enable notifications in your browser settings.'
                            : 'Permission required'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleBrowserNotifications}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        browserNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          browserNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Desktop App Notifications */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Desktop className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Desktop App Notifications</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Show notifications in the desktop app when available
                        </p>
                        <div className="mt-2 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200 inline-flex items-center space-x-1">
                          <Info className="w-3 h-3" />
                          <span>Desktop app coming soon</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={toggleDesktopNotifications}
                      disabled={true}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        desktopNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      } opacity-50 cursor-not-allowed`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          desktopNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Email Notifications */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Receive important notifications via email
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Only high-priority notifications will be sent by email
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleEmailNotifications}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        emailNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Timing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Timing</h3>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quiet Hours</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    During quiet hours, only high-priority notifications will be shown
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        defaultValue="22:00"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        defaultValue="08:00"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="flex flex-col items-center justify-center py-6">
              <NotificationDemo />
              
              <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">About Notifications</h4>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                      Notifications appear in three places:
                    </p>
                    <ul className="text-blue-700 dark:text-blue-300 text-sm mt-2 space-y-1">
                      <li>• In the notification center (bell icon)</li>
                      <li>• As toast notifications in the corner of the screen</li>
                      <li>• As browser notifications (if enabled)</li>
                    </ul>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mt-2">
                      Click the buttons above to test different notification types.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollableContainer>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;