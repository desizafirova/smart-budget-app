/**
 * Authentication Service Interface
 *
 * This abstraction layer allows the application to depend on interfaces
 * rather than specific BaaS implementations (Firebase, Supabase, etc).
 *
 * Firebase implementation: src/services/firebase/firebaseAuth.ts
 */

import type { User } from '@/types/user';

// Re-export User type for convenience
export type { User };

/**
 * Authentication service interface
 * Provides methods for user authentication and session management
 */
export interface IAuthService {
  /**
   * Sign in anonymously for instant access
   * @returns Promise resolving to the anonymous User
   */
  signInAnonymously(): Promise<User>;

  /**
   * Link anonymous account with email and password
   * @param email User's email address
   * @param password User's password
   * @returns Promise resolving to the updated User
   */
  linkWithEmail(email: string, password: string): Promise<User>;

  /**
   * Sign in with email and password
   * @param email User's email address
   * @param password User's password
   * @returns Promise resolving to the authenticated User
   */
  signInWithEmail(email: string, password: string): Promise<User>;

  /**
   * Sign out the current user
   * @returns Promise resolving when sign-out is complete
   */
  signOut(): Promise<void>;

  /**
   * Get the currently authenticated user (synchronous)
   * @returns Current User or null if not authenticated
   */
  getCurrentUser(): User | null;

  /**
   * Subscribe to authentication state changes
   * @param callback Function called when auth state changes
   * @returns Unsubscribe function to stop listening
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void;

  /**
   * Send password reset email to user
   * @param email User's email address
   * @returns Promise resolving when email is sent
   * @throws AuthError if email not found or invalid
   */
  sendPasswordResetEmail(email: string): Promise<void>;
}
