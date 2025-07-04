import React, { useState, useEffect } from 'react';
import { Mail, X, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const EmailVerificationBanner: React.FC = () => {
  const { user, sendVerificationEmail, checkEmailVerification } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Show banner only if user is authenticated but email is not verified
  useEffect(() => {
    setIsVisible(!!user && !user.emailVerified);
  }, [user]);

  // Cooldown timer
  useEffect(() => {
    if (lastSentTime && cooldownTime > 0) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - lastSentTime) / 1000);
        const remaining = Math.max(0, 60 - elapsed);
        setCooldownTime(remaining);
        
        if (remaining === 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lastSentTime, cooldownTime]);

  // Auto-hide messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSendVerification = async () => {
    setIsSending(true);
    setMessage(null);

    try {
      const result = await sendVerificationEmail();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox and spam folder.' });
        setLastSentTime(Date.now());
        setCooldownTime(60);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send verification email' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    setMessage(null);

    try {
      const result = await checkEmailVerification();
      
      if (result.success) {
        if (result.verified) {
          setMessage({ type: 'success', text: 'Email verified successfully!' });
          setTimeout(() => setIsVisible(false), 2000);
        } else {
          setMessage({ type: 'error', text: 'Email not yet verified. Please check your inbox and click the verification link.' });
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to check verification status' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || !user) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Please verify your email address
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  We sent a verification email to <span className="font-medium">{user.email}</span>. 
                  Click the link in the email to verify your account.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-3 sm:mt-0">
              {/* Status Message */}
              {message && (
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm ${
                  message.type === 'success' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCheckVerification}
                  disabled={isChecking}
                  className="flex items-center space-x-2 px-3 py-1 text-sm font-medium text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Checking...' : 'Check Status'}</span>
                </button>

                <button
                  onClick={handleSendVerification}
                  disabled={isSending || cooldownTime > 0}
                  className="flex items-center space-x-2 px-4 py-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : cooldownTime > 0 ? (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Resend in {cooldownTime}s</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Resend Email</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDismiss}
                  className="p-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;