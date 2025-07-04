import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Edit3, Mail, Calendar, ChevronDown, MailCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ProfilePage from './ProfilePage';
import SettingsModal from './SettingsModal';

const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { user, logout, sendVerificationEmail, checkEmailVerification } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleProfileClick = () => {
    setShowProfilePage(true);
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    setShowSettingsModal(true);
    setIsOpen(false);
  };

  const handleSendVerification = async () => {
    try {
      await sendVerificationEmail();
      // Show success message or handle result
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    try {
      await checkEmailVerification();
    } catch (error) {
      console.error('Failed to check verification:', error);
    } finally {
      setIsCheckingVerification(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* User Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Email verification indicator */}
            {!user.emailVerified && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-gray-800" 
                   title="Email not verified" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
            {user.name}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            {/* User Info */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {!user.emailVerified && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-gray-800" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Verification Status */}
            {!user.emailVerified && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Email Not Verified
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Please verify your email to access all features
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={handleSendVerification}
                        className="text-xs text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 font-medium underline"
                      >
                        Resend Email
                      </button>
                      <span className="text-amber-600 dark:text-amber-400">•</span>
                      <button
                        onClick={handleCheckVerification}
                        disabled={isCheckingVerification}
                        className="flex items-center space-x-1 text-xs text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 font-medium underline disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isCheckingVerification ? 'animate-spin' : ''}`} />
                        <span>Check Status</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {user.emailVerified && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <MailCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Email Verified
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Your account is fully activated
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Account Details */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{user.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Joined:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Last login:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatDate(user.lastLogin)}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Profile Settings</span>
              </button>
              
              <button
                onClick={handleSettingsClick}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              
              <hr className="my-2 border-gray-200 dark:border-gray-700" />
              
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Page Modal */}
      {showProfilePage && (
        <ProfilePage onClose={() => setShowProfilePage(false)} />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal 
          isOpen={showSettingsModal} 
          onClose={() => setShowSettingsModal(false)} 
        />
      )}
    </>
  );
};

export default UserMenu;