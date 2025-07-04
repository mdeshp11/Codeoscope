import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, CheckCircle, Info, Volume2, VolumeX, Clock, Zap } from 'lucide-react';

interface NotificationPreference {
  id: string;
  type: string;
  title: string;
  description: string;
  enabled: boolean;
  sound: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface NotificationPreferencesProps {
  onClose: () => void;
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ onClose }) => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('codeoscope-notification-preferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    } else {
      // Default preferences
      const defaultPreferences: NotificationPreference[] = [
        {
          id: 'analysis-complete',
          type: 'analysis',
          title: 'Analysis Complete',
          description: 'Notify when code analysis is finished',
          enabled: true,
          sound: false,
          priority: 'high'
        },
        {
          id: 'architecture-complete',
          type: 'analysis',
          title: 'Architecture Diagram Ready',
          description: 'Notify when architecture diagrams are generated',
          enabled: true,
          sound: false,
          priority: 'medium'
        },
        {
          id: 'upload-complete',
          type: 'system',
          title: 'Upload Complete',
          description: 'Notify when file uploads are finished',
          enabled: true,
          sound: false,
          priority: 'medium'
        },
        {
          id: 'errors',
          type: 'system',
          title: 'Errors & Warnings',
          description: 'Notify about system errors and warnings',
          enabled: true,
          sound: true,
          priority: 'high'
        },
        {
          id: 'new-features',
          type: 'system',
          title: 'New Features',
          description: 'Notify about new features and updates',
          enabled: true,
          sound: false,
          priority: 'low'
        },
        {
          id: 'email-verification',
          type: 'account',
          title: 'Email Verification',
          description: 'Notify about email verification status',
          enabled: true,
          sound: false,
          priority: 'high'
        },
        {
          id: 'account-activity',
          type: 'account',
          title: 'Account Activity',
          description: 'Notify about sign-ins and account changes',
          enabled: true,
          sound: true,
          priority: 'high'
        }
      ];
      setPreferences(defaultPreferences);
    }

    // Load sound setting
    const savedSound = localStorage.getItem('codeoscope-notification-sound');
    setSoundEnabled(savedSound === 'true');
  }, []);

  // Save preferences when they change
  useEffect(() => {
    if (hasChanges) {
      localStorage.setItem('codeoscope-notification-preferences', JSON.stringify(preferences));
      localStorage.setItem('codeoscope-notification-sound', String(soundEnabled));
    }
  }, [preferences, soundEnabled, hasChanges]);

  const handleTogglePreference = (id: string) => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
    setHasChanges(true);
  };

  const handleToggleSound = (id: string) => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.id === id ? { ...pref, sound: !pref.sound } : pref
      )
    );
    setHasChanges(true);
  };

  const handleToggleAllSound = () => {
    setSoundEnabled(!soundEnabled);
    setPreferences(prev => 
      prev.map(pref => ({ ...pref, sound: !soundEnabled }))
    );
    setHasChanges(true);
  };

  const handleChangePriority = (id: string, priority: 'high' | 'medium' | 'low') => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.id === id ? { ...pref, priority } : pref
      )
    );
    setHasChanges(true);
  };

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded-full flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>High</span>
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs rounded-full flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Medium</span>
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full flex items-center space-x-1">
            <Info className="w-3 h-3" />
            <span>Low</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-2xl w-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold">Notification Preferences</h2>
        </div>
        <p className="text-blue-100">
          Customize which notifications you receive and how they're delivered
        </p>
      </div>

      {/* Global Sound Setting */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            )}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Notification Sounds</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {soundEnabled ? 'Sounds are enabled for notifications' : 'Sounds are disabled for all notifications'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleAllSound}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              soundEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                soundEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto p-4 space-y-4">
        {/* Group by type */}
        {['system', 'analysis', 'account'].map(type => {
          const typePreferences = preferences.filter(pref => pref.type === type);
          if (typePreferences.length === 0) return null;
          
          return (
            <div key={type} className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                {type} Notifications
              </h3>
              
              {typePreferences.map(pref => (
                <div 
                  key={pref.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{pref.title}</h4>
                        {getPriorityBadge(pref.priority)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {pref.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleToggleSound(pref.id)}
                        disabled={!pref.enabled}
                        className={`p-2 rounded-lg transition-colors ${
                          pref.sound && pref.enabled
                            ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                        } ${!pref.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={pref.sound ? 'Sound enabled' : 'Sound disabled'}
                      >
                        {pref.sound ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <VolumeX className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleTogglePreference(pref.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          pref.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            pref.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  
                  {/* Priority Selector */}
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Priority:</span>
                    <div className="flex space-x-1">
                      {(['low', 'medium', 'high'] as const).map(priority => (
                        <button
                          key={priority}
                          onClick={() => handleChangePriority(pref.id, priority)}
                          disabled={!pref.enabled}
                          className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            pref.priority === priority
                              ? priority === 'high' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          } ${!pref.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferences;