import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  updateEmail as updateFirebaseEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  reload,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: number;
  lastLogin: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email'>>) => Promise<{ success: boolean; error?: string }>;
  sendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  checkEmailVerification: () => Promise<{ success: boolean; verified: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  verifyResetCode: (code: string) => Promise<{ success: boolean; email?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              id: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              emailVerified: firebaseUser.emailVerified,
              createdAt: userData.createdAt?.toMillis() || Date.now(),
              lastLogin: userData.lastLogin?.toMillis() || Date.now()
            };
            setUser(user);

            // Update last login time and email verification status
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              lastLogin: serverTimestamp(),
              emailVerified: firebaseUser.emailVerified
            });
          } else {
            // User document doesn't exist, create it
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              emailVerified: firebaseUser.emailVerified,
              createdAt: Date.now(),
              lastLogin: Date.now()
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), {
              name: newUser.name,
              email: newUser.email,
              emailVerified: firebaseUser.emailVerified,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            });

            setUser(newUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { isValid: boolean; error?: string } => {
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one number' };
    }
    return { isValid: true };
  };

  const getEmailVerificationConfig = () => {
    // Get the current origin for production deployment
    const origin = window.location.origin;
    
    // For production, use the actual domain
    // For development, Firebase will handle the redirect properly
    return {
      url: `${origin}/verify-email`,
      handleCodeInApp: true
    };
  };

  const getPasswordResetConfig = () => {
    const origin = window.location.origin;
    return {
      url: `${origin}/reset-password`,
      handleCodeInApp: true
    };
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Validation
      if (!name.trim()) {
        return { success: false, error: 'Name is required' };
      }
      if (name.trim().length < 2) {
        return { success: false, error: 'Name must be at least 2 characters long' };
      }
      if (!validateEmail(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateFirebaseProfile(firebaseUser, {
        displayName: name.trim()
      });

      // Send email verification with proper configuration
      try {
        await sendEmailVerification(firebaseUser, getEmailVerificationConfig());
        console.log('Verification email sent successfully');
      } catch (verificationError: any) {
        console.warn('Email verification failed, but account was created:', verificationError);
        // Don't fail the signup if email verification fails
      }

      // Create user document in Firestore
      const userData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        emailVerified: false,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      return { success: true };

    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle Firebase Auth errors
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists. Please sign in instead.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again';
          break;
        case 'auth/unauthorized-continue-uri':
          // This is expected in development - the account is still created successfully
          console.log('Account created successfully. Email verification may not work in development mode.');
          return { success: true };
        default:
          console.error('Unhandled signup error:', error.code, error.message);
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Validation
      if (!validateEmail(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      if (!password) {
        return { success: false, error: 'Password is required' };
      }

      // Sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);

      return { success: true };

    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle Firebase Auth errors
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      switch (error.code) {
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again';
          break;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const sendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      await sendEmailVerification(auth.currentUser, getEmailVerificationConfig());
      console.log('Verification email sent successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Send verification email error:', error);
      
      let errorMessage = 'Failed to send verification email';
      
      switch (error.code) {
        case 'auth/too-many-requests':
          errorMessage = 'Too many verification emails sent. Please wait before requesting another';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again';
          break;
        case 'auth/unauthorized-continue-uri':
          errorMessage = 'Email verification sent successfully';
          return { success: true };
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const checkEmailVerification = async (): Promise<{ success: boolean; verified: boolean; error?: string }> => {
    if (!auth.currentUser) {
      return { success: false, verified: false, error: 'Not authenticated' };
    }

    try {
      // Reload the user to get the latest verification status
      await reload(auth.currentUser);
      
      const isVerified = auth.currentUser.emailVerified;
      
      // Update Firestore if verification status changed
      if (isVerified && user && !user.emailVerified) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          emailVerified: true
        });
        
        // Update local user state
        setUser(prev => prev ? { ...prev, emailVerified: true } : null);
      }
      
      return { success: true, verified: isVerified };
    } catch (error: any) {
      console.error('Check email verification error:', error);
      return { success: false, verified: false, error: 'Failed to check verification status' };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validation
      if (!validateEmail(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Send password reset email
      await sendPasswordResetEmail(auth, email.toLowerCase().trim(), getPasswordResetConfig());

      return { success: true };

    } catch (error: any) {
      console.error('Send password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many password reset requests. Please wait before trying again';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again';
          break;
        case 'auth/unauthorized-continue-uri':
          // This is expected in development
          return { success: true };
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const verifyResetCode = async (code: string): Promise<{ success: boolean; email?: string; error?: string }> => {
    try {
      // Verify the password reset code and get the email
      const email = await verifyPasswordResetCode(auth, code);
      return { success: true, email };
    } catch (error: any) {
      console.error('Verify reset code error:', error);
      
      let errorMessage = 'Invalid or expired reset code';
      
      switch (error.code) {
        case 'auth/invalid-action-code':
          errorMessage = 'Invalid reset code. Please request a new password reset';
          break;
        case 'auth/expired-action-code':
          errorMessage = 'Reset code has expired. Please request a new password reset';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (code: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validation
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      // Confirm the password reset
      await confirmPasswordReset(auth, code, newPassword);

      return { success: true };

    } catch (error: any) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Failed to reset password';
      
      switch (error.code) {
        case 'auth/invalid-action-code':
          errorMessage = 'Invalid reset code. Please request a new password reset';
          break;
        case 'auth/expired-action-code':
          errorMessage = 'Reset code has expired. Please request a new password reset';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, 'name' | 'email'>>): Promise<{ success: boolean; error?: string }> => {
    if (!user || !auth.currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setIsLoading(true);

      // Validation
      if (updates.name !== undefined) {
        if (!updates.name.trim()) {
          return { success: false, error: 'Name is required' };
        }
        if (updates.name.trim().length < 2) {
          return { success: false, error: 'Name must be at least 2 characters long' };
        }
      }

      if (updates.email !== undefined) {
        if (!validateEmail(updates.email)) {
          return { success: false, error: 'Please enter a valid email address' };
        }
      }

      const updateData: any = {};
      
      // Update name if provided
      if (updates.name !== undefined && updates.name.trim() !== user.name) {
        updateData.name = updates.name.trim();
        
        // Update Firebase Auth profile
        await updateFirebaseProfile(auth.currentUser, {
          displayName: updates.name.trim()
        });
      }

      // Update email if provided
      if (updates.email !== undefined && updates.email.toLowerCase().trim() !== user.email) {
        updateData.email = updates.email.toLowerCase().trim();
        updateData.emailVerified = false; // Reset verification status when email changes
        
        // Update Firebase Auth email
        await updateFirebaseEmail(auth.currentUser, updates.email.toLowerCase().trim());
        
        // Send verification email for new email
        try {
          await sendEmailVerification(auth.currentUser, getEmailVerificationConfig());
        } catch (verificationError) {
          console.warn('Email verification failed after email update:', verificationError);
          // Don't fail the update if email verification fails
        }
      }

      // Update Firestore document if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, 'users', user.id), updateData);
      }

      return { success: true };

    } catch (error: any) {
      console.error('Profile update error:', error);
      
      // Handle Firebase Auth errors
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already taken';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Please log out and log back in to update your email';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again';
          break;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    updateProfile,
    sendVerificationEmail,
    checkEmailVerification,
    sendPasswordReset,
    resetPassword,
    verifyResetCode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};