/**
 * Firebase Authentication Service Implementation
 *
 * Implements IAuthService interface using Firebase Authentication SDK.
 * Converts Firebase User type to application User type and handles errors.
 *
 * This is the only file that should import Firebase Auth SDK methods.
 * Application code should import from @/services/auth instead.
 */

import {
  signInAnonymously as firebaseSignInAnonymously,
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebaseConfig';
import type { User, IAuthService } from '@/services/auth';

/**
 * Convert Firebase User to application User type
 */
const convertUser = (firebaseUser: FirebaseUser | null): User | null => {
  if (!firebaseUser) return null;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    isAnonymous: firebaseUser.isAnonymous,
  };
};

/**
 * Firebase Authentication Service
 * Implements IAuthService using Firebase Auth SDK
 */
class FirebaseAuthService implements IAuthService {
  /**
   * Sign in anonymously for instant access
   */
  async signInAnonymously(): Promise<User> {
    try {
      const credential = await firebaseSignInAnonymously(auth);
      const user = convertUser(credential.user);

      if (!user) {
        throw new Error('Failed to sign in anonymously');
      }

      return user;
    } catch (error: any) {
      throw new Error(`Anonymous sign-in failed: ${error.message}`);
    }
  }

  /**
   * Link anonymous account with email and password
   */
  async linkWithEmail(email: string, password: string): Promise<User> {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      if (!currentUser.isAnonymous) {
        throw new Error('Current user is not anonymous');
      }

      const credential = EmailAuthProvider.credential(email, password);
      const userCredential = await linkWithCredential(currentUser, credential);
      const user = convertUser(userCredential.user);

      if (!user) {
        throw new Error('Failed to link account');
      }

      return user;
    } catch (error: any) {
      throw new Error(`Account linking failed: ${error.message}`);
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = convertUser(credential.user);

      if (!user) {
        throw new Error('Failed to sign in');
      }

      return user;
    } catch (error: any) {
      // Handle common Firebase auth errors
      let errorMessage = 'Sign-in failed';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      }

      throw new Error(`${errorMessage}: ${error.message}`);
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw new Error(`Sign-out failed: ${error.message}`);
    }
  }

  /**
   * Get the currently authenticated user (synchronous)
   */
  getCurrentUser(): User | null {
    return convertUser(auth.currentUser);
  }

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      callback(convertUser(firebaseUser));
    });
  }
}

/**
 * Export singleton instance
 * Application code imports this instance via @/services/firebase/firebaseAuth
 */
export const authService = new FirebaseAuthService();

/**
 * Default export for convenience
 */
export default authService;
