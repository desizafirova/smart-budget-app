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
import type { User } from '@/types/user';
import type { IAuthService } from '@/services/auth';
import { AuthError, AuthErrorCode } from '@/types/errors';

/**
 * Convert Firebase User to application User type
 */
const convertUser = (firebaseUser: FirebaseUser | null): User | null => {
  if (!firebaseUser) return null;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    isAnonymous: firebaseUser.isAnonymous,
    createdAt: firebaseUser.metadata.creationTime
      ? new Date(firebaseUser.metadata.creationTime)
      : new Date(),
    lastSignInAt: firebaseUser.metadata.lastSignInTime
      ? new Date(firebaseUser.metadata.lastSignInTime)
      : new Date(),
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
        throw new AuthError(
          AuthErrorCode.ANONYMOUS_SIGN_IN_FAILED,
          'Failed to sign in anonymously: user conversion returned null'
        );
      }

      return user;
    } catch (error: unknown) {
      // If already an AuthError, re-throw
      if (error instanceof AuthError) {
        throw error;
      }

      // Convert Firebase errors to AuthError
      throw AuthError.fromFirebaseError(error);
    }
  }

  /**
   * Link anonymous account with email and password
   */
  async linkWithEmail(email: string, password: string): Promise<User> {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new AuthError(
          AuthErrorCode.NO_USER_SIGNED_IN,
          'No user is currently signed in'
        );
      }

      if (!currentUser.isAnonymous) {
        throw new AuthError(
          AuthErrorCode.NOT_ANONYMOUS,
          'Current user is not anonymous'
        );
      }

      const credential = EmailAuthProvider.credential(email, password);
      const userCredential = await linkWithCredential(currentUser, credential);
      const user = convertUser(userCredential.user);

      if (!user) {
        throw new AuthError(
          AuthErrorCode.ACCOUNT_LINKING_FAILED,
          'Failed to link account: user conversion returned null'
        );
      }

      return user;
    } catch (error: unknown) {
      // If already an AuthError, re-throw
      if (error instanceof AuthError) {
        throw error;
      }

      // Convert Firebase errors to AuthError
      throw AuthError.fromFirebaseError(error);
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
        throw new AuthError(
          AuthErrorCode.UNKNOWN_ERROR,
          'Failed to sign in: user conversion returned null'
        );
      }

      return user;
    } catch (error: unknown) {
      // If already an AuthError, re-throw
      if (error instanceof AuthError) {
        throw error;
      }

      // Convert Firebase errors to AuthError
      throw AuthError.fromFirebaseError(error);
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: unknown) {
      // Convert Firebase errors to AuthError
      throw AuthError.fromFirebaseError(error);
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
