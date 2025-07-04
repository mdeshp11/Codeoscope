import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Monitor, 
  Moon, 
  Sun, 
  Code, 
  FileText, 
  Database, 
  Bell, 
  Shield, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Palette, 
  Zap, 
  Settings as SettingsIcon,
  HardDrive,
  Clock,
  Globe,
  Cpu,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  Mail
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import NotificationSettings from './NotificationSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsData {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  codeTheme: 'default' | 'dark' | 'github' | 'monokai';
  showLineNumbers: boolean;
  enableAnimations: boolean;
  compactMode: boolean;
  
  // Code Analysis
  autoAnalyze: boolean;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  enableAISuggestions: boolean;
  showComplexityMetrics: boolean;
  highlightSyntax: boolean;
  enableCodeCompletion: boolean;
  
  // Data & Privacy
  saveAnalysisHistory: boolean;
  enableTelemetry: boolean;
  autoSaveProjects: boolean;
  maxStorageSize: number; // in MB
  clearDataOnExit: boolean;
  
  // Notifications
  enableNotifications: boolean;
  notifyOnAnalysisComplete: boolean;
  notifyOnErrors: boolean;
  soundEnabled: boolean;
  
  // Performance
  enableCaching: boolean;
  maxCacheSize: number; // in MB
  preloadDiagrams: boolean;
  enableLazyLoading: boolean;
  
  // Advanced
  enableDebugMode: boolean;
  showPerformanceMetrics: boolean;
  enableExperimentalFeatures: boolean;
  apiTimeout: number; // in seconds
}

const defaultSettings: SettingsData = {
  theme: 'system',
  fontSize: 'medium',
  codeTheme: 'default',
  showLineNumbers: true,
  enableAnimations: true,
  compactMode: false,
  autoAnalyze: true,
  analysisDepth: 'detailed',
  enableAISuggestions: true,
  showComplexityMetrics: true,
  highlightSyntax: true,
  enableCodeCompletion: true,
  saveAnalysisHistory: true,
  enableTelemetry: false,
  autoSaveProjects: true,
  maxStorageSize: 100,
  clearDataOnExit: false,
  enableNotifications: true,
  notifyOnAnalysisComplete: true,
  notifyOnErrors: true,
  soundEnabled: false,
  enableCaching: true,
  maxCacheSize: 50,
  preloadDiagrams: true,
  enableLazyLoading: true,
  enableDebugMode: false,
  showPerformanceMetrics: false,
  enableExperimentalFeatures: false,
  apiTimeout: 30
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'analysis' | 'data' | 'notifications' | 'performance' | 'advanced'>('appearance');
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0 });
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
  const { theme, setTheme } = useTheme();

  // Load settings from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem('codeoscope-settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        } catch (error) {
          console.error('Failed to parse saved settings:', error);
        }
      }
      
      // Calculate storage usage
      calculateStorageUsage();
    }
  }, [isOpen]);

  const calculateStorageUsage = () => {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      
      // Convert to MB and estimate total available (usually ~5-10MB)
      const usedMB = totalSize / (1024 * 1024);
      const totalMB = 10; // Estimated localStorage limit
      
      setStorageUsage({ used: usedMB, total: totalMB });
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
    }
  };

  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    // Apply theme change immediately
    if (key === 'theme') {
      setTheme(value);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save to localStorage
      localStorage.setItem('codeoscope-settings', JSON.stringify(settings));
      
      // Apply theme setting
      setTheme(settings.theme);
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setHasChanges(false);
      
      // Show success message briefly
      setTimeout(() => {
        if (isOpen) {
          // Could show a toast notification here
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    setShowResetConfirm(false);
    setTheme(defaultSettings.theme);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all application data? This action cannot be undone.')) {
      // Clear specific application data
      const keysToRemove = [
        'codeoscope-settings',
        'codeoscope-projects',
        'codeoscope-analysis-cache',
        'codeoscope-file-cache'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      calculateStorageUsage();
      alert('Application data cleared successfully.');
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'codeoscope-settings.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings({ ...defaultSettings, ...imported });
        setHasChanges(true);
      } catch (error) {
        alert('Invalid settings file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'analysis', label: 'Code Analysis', icon: <Code className="w-4 h-4" /> },
    { id: 'data', label: 'Data & Privacy', icon: <Database className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'performance', label: 'Performance', icon: <Zap className="w-4 h-4" /> },
    { id: 'advanced', label: 'Advanced', icon: <SettingsIcon className="w-4 h-4" /> }
  ];

  const ToggleSwitch: React.FC<{ 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    disabled?: boolean;
  }> = ({ checked, onChange, disabled = false }) => (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      disabled={disabled}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const SettingItem: React.FC<{
    title: string;
    description: string;
    children: React.ReactNode;
    warning?: string;
  }> = ({ title, description, children, warning }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex-1 mr-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        {warning && (
          <div className="flex items-center space-x-2 mt-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-amber-600 dark:text-amber-400">{warning}</p>
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );

  // Show notification settings modal if requested
  if (showNotificationSettings) {
    return (
      <NotificationSettings 
        isOpen={true} 
        onClose={() => setShowNotificationSettings(false)} 
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your Codeoscope experience</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab.icon}
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance Settings</h3>
                    
                    <SettingItem
                      title="Theme"
                      description="Choose your preferred color scheme"
                    >
                      <div className="flex space-x-2">
                        {[
                          { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
                          { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
                          { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleSettingChange('theme', option.value)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                              settings.theme === option.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {option.icon}
                            <span className="text-sm">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </SettingItem>

                    <SettingItem
                      title="Font Size"
                      description="Adjust the size of text throughout the application"
                    >
                      <select
                        value={settings.fontSize}
                        onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </SettingItem>

                    <SettingItem
                      title="Code Theme"
                      description="Choose syntax highlighting theme for code display"
                    >
                      <select
                        value={settings.codeTheme}
                        onChange={(e) => handleSettingChange('codeTheme', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="default">Default</option>
                        <option value="dark">Dark</option>
                        <option value="github">GitHub</option>
                        <option value="monokai">Monokai</option>
                      </select>
                    </SettingItem>

                    <SettingItem
                      title="Show Line Numbers"
                      description="Display line numbers in code viewers"
                    >
                      <ToggleSwitch
                        checked={settings.showLineNumbers}
                        onChange={(checked) => handleSettingChange('showLineNumbers', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Enable Animations"
                      description="Show smooth transitions and animations"
                    >
                      <ToggleSwitch
                        checked={settings.enableAnimations}
                        onChange={(checked) => handleSettingChange('enableAnimations', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Compact Mode"
                      description="Use a more compact layout to fit more content"
                    >
                      <ToggleSwitch
                        checked={settings.compactMode}
                        onChange={(checked) => handleSettingChange('compactMode', checked)}
                      />
                    </SettingItem>
                  </div>
                </div>
              )}

              {/* Code Analysis Tab */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Code Analysis Settings</h3>
                    
                    <SettingItem
                      title="Auto-Analyze Code"
                      description="Automatically analyze code when files are uploaded"
                    >
                      <ToggleSwitch
                        checked={settings.autoAnalyze}
                        onChange={(checked) => handleSettingChange('autoAnalyze', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Analysis Depth"
                      description="Choose how thorough the code analysis should be"
                    >
                      <select
                        value={settings.analysisDepth}
                        onChange={(e) => handleSettingChange('analysisDepth', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="basic">Basic</option>
                        <option value="detailed">Detailed</option>
                        <option value="comprehensive">Comprehensive</option>
                      </select>
                    </SettingItem>

                    <SettingItem
                      title="AI Suggestions"
                      description="Enable AI-powered code improvement suggestions"
                    >
                      <ToggleSwitch
                        checked={settings.enableAISuggestions}
                        onChange={(checked) => handleSettingChange('enableAISuggestions', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Complexity Metrics"
                      description="Show code complexity indicators and metrics"
                    >
                      <ToggleSwitch
                        checked={settings.showComplexityMetrics}
                        onChange={(checked) => handleSettingChange('showComplexityMetrics', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Syntax Highlighting"
                      description="Enable syntax highlighting in code viewers"
                    >
                      <ToggleSwitch
                        checked={settings.highlightSyntax}
                        onChange={(checked) => handleSettingChange('highlightSyntax', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Code Completion"
                      description="Enable intelligent code completion suggestions"
                    >
                      <ToggleSwitch
                        checked={settings.enableCodeCompletion}
                        onChange={(checked) => handleSettingChange('enableCodeCompletion', checked)}
                      />
                    </SettingItem>
                  </div>
                </div>
              )}

              {/* Data & Privacy Tab */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data & Privacy Settings</h3>
                    
                    <SettingItem
                      title="Save Analysis History"
                      description="Keep a history of your code analysis results"
                    >
                      <ToggleSwitch
                        checked={settings.saveAnalysisHistory}
                        onChange={(checked) => handleSettingChange('saveAnalysisHistory', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Enable Telemetry"
                      description="Help improve Codeoscope by sharing anonymous usage data"
                    >
                      <ToggleSwitch
                        checked={settings.enableTelemetry}
                        onChange={(checked) => handleSettingChange('enableTelemetry', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Auto-Save Projects"
                      description="Automatically save your projects as you work"
                    >
                      <ToggleSwitch
                        checked={settings.autoSaveProjects}
                        onChange={(checked) => handleSettingChange('autoSaveProjects', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Maximum Storage Size"
                      description="Limit how much local storage the app can use"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="10"
                          max="500"
                          step="10"
                          value={settings.maxStorageSize}
                          onChange={(e) => handleSettingChange('maxStorageSize', parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-16">
                          {settings.maxStorageSize} MB
                        </span>
                      </div>
                    </SettingItem>

                    <SettingItem
                      title="Clear Data on Exit"
                      description="Automatically clear temporary data when closing the app"
                      warning="This will remove cached analysis results"
                    >
                      <ToggleSwitch
                        checked={settings.clearDataOnExit}
                        onChange={(checked) => handleSettingChange('clearDataOnExit', checked)}
                      />
                    </SettingItem>

                    {/* Storage Usage */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Storage Usage</h4>
                        <button
                          onClick={calculateStorageUsage}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Used</span>
                          <span className="text-gray-900 dark:text-white">
                            {storageUsage.used.toFixed(2)} MB of {storageUsage.total} MB
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((storageUsage.used / storageUsage.total) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleClearData}
                        className="mt-3 flex items-center space-x-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear All Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Settings</h3>
                      <button
                        onClick={() => setShowNotificationSettings(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center space-x-2"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Advanced Settings</span>
                      </button>
                    </div>
                    
                    <SettingItem
                      title="Enable Notifications"
                      description="Allow the app to show browser notifications"
                    >
                      <ToggleSwitch
                        checked={settings.enableNotifications}
                        onChange={(checked) => handleSettingChange('enableNotifications', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Analysis Complete"
                      description="Notify when code analysis is finished"
                    >
                      <ToggleSwitch
                        checked={settings.notifyOnAnalysisComplete}
                        onChange={(checked) => handleSettingChange('notifyOnAnalysisComplete', checked)}
                        disabled={!settings.enableNotifications}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Error Notifications"
                      description="Show notifications when errors occur"
                    >
                      <ToggleSwitch
                        checked={settings.notifyOnErrors}
                        onChange={(checked) => handleSettingChange('notifyOnErrors', checked)}
                        disabled={!settings.enableNotifications}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Sound Effects"
                      description="Play sounds for notifications and interactions"
                    >
                      <ToggleSwitch
                        checked={settings.soundEnabled}
                        onChange={(checked) => handleSettingChange('soundEnabled', checked)}
                      />
                    </SettingItem>

                    {/* Notification Demo */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                      <div className="flex items-start space-x-3">
                        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">Notification Center</h4>
                          <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                            Click the bell icon in the header to view your notifications. You can also manage notification preferences in the advanced settings.
                          </p>
                          <button
                            onClick={() => setShowNotificationSettings(true)}
                            className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                          >
                            Configure Notification Preferences
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Settings</h3>
                    
                    <SettingItem
                      title="Enable Caching"
                      description="Cache analysis results for faster loading"
                    >
                      <ToggleSwitch
                        checked={settings.enableCaching}
                        onChange={(checked) => handleSettingChange('enableCaching', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Maximum Cache Size"
                      description="Limit how much space cached data can use"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="10"
                          max="200"
                          step="10"
                          value={settings.maxCacheSize}
                          onChange={(e) => handleSettingChange('maxCacheSize', parseInt(e.target.value))}
                          className="flex-1"
                          disabled={!settings.enableCaching}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-16">
                          {settings.maxCacheSize} MB
                        </span>
                      </div>
                    </SettingItem>

                    <SettingItem
                      title="Preload Diagrams"
                      description="Load architecture diagrams in the background"
                    >
                      <ToggleSwitch
                        checked={settings.preloadDiagrams}
                        onChange={(checked) => handleSettingChange('preloadDiagrams', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Lazy Loading"
                      description="Load content only when needed to improve performance"
                    >
                      <ToggleSwitch
                        checked={settings.enableLazyLoading}
                        onChange={(checked) => handleSettingChange('enableLazyLoading', checked)}
                      />
                    </SettingItem>
                  </div>
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advanced Settings</h3>
                    
                    <SettingItem
                      title="Debug Mode"
                      description="Enable detailed logging and debug information"
                      warning="May impact performance"
                    >
                      <ToggleSwitch
                        checked={settings.enableDebugMode}
                        onChange={(checked) => handleSettingChange('enableDebugMode', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Performance Metrics"
                      description="Show performance timing information"
                    >
                      <ToggleSwitch
                        checked={settings.showPerformanceMetrics}
                        onChange={(checked) => handleSettingChange('showPerformanceMetrics', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Experimental Features"
                      description="Enable beta features and experimental functionality"
                      warning="These features may be unstable"
                    >
                      <ToggleSwitch
                        checked={settings.enableExperimentalFeatures}
                        onChange={(checked) => handleSettingChange('enableExperimentalFeatures', checked)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="API Timeout"
                      description="Maximum time to wait for API responses"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="10"
                          max="120"
                          step="5"
                          value={settings.apiTimeout}
                          onChange={(e) => handleSettingChange('apiTimeout', parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-16">
                          {settings.apiTimeout}s
                        </span>
                      </div>
                    </SettingItem>

                    {/* Import/Export Settings */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Settings Management</h4>
                      <div className="flex space-x-3">
                        <button
                          onClick={exportSettings}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export</span>
                        </button>
                        <label className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span>Import</span>
                          <input
                            type="file"
                            accept=".json"
                            onChange={importSettings}
                            className="hidden"
                          />
                        </label>
                        <button
                          onClick={() => setShowResetConfirm(true)}
                          className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            {hasChanges && (
              <>
                <Info className="w-4 h-4" />
                <span>You have unsaved changes</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Reset Settings
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to reset all settings to their default values? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;