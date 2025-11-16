/**
 * Authentication Store (Zustand)
 *
 * Global state management for authentication state.
 * Uses Zustand persist middleware for localStorage persistence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user';

/**
 * Authentication store state interface
 */
interface AuthState {
  /** Currently authenticated user (null if not signed in) */
  user: User | null;

  /** Whether the current user is anonymous */
  isAnonymous: boolean;

  /** Loading state for async auth operations */
  isLoading: boolean;

  /** Error message (null if no error) */
  error: string | null;
}

/**
 * Authentication store actions interface
 */
interface AuthActions {
  /** Set the current user and update isAnonymous */
  setUser: (user: User | null) => void;

  /** Clear the current user (sign out) */
  clearUser: () => void;

  /** Set loading state */
  setLoading: (loading: boolean) => void;

  /** Set error message */
  setError: (error: string | null) => void;
}

/**
 * Complete authentication store interface
 */
export type AuthStore = AuthState & AuthActions;

/**
 * Authentication store with persistence
 * Persists user and isAnonymous to localStorage
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAnonymous: false,
      isLoading: true, // Start as loading until auth state is determined
      error: null,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAnonymous: user?.isAnonymous ?? false,
          error: null, // Clear error on successful sign-in
        }),

      clearUser: () =>
        set({
          user: null,
          isAnonymous: false,
          error: null,
        }),

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      setError: (error) =>
        set({
          error,
          isLoading: false, // Stop loading on error
        }),
    }),
    {
      name: 'smartbudget-auth', // localStorage key
      version: 1,
      partialize: (state) => ({
        user: state.user,
        isAnonymous: state.isAnonymous,
        // Don't persist loading/error states
      }),
    }
  )
);

/**
 * Selector: Get current user
 * @returns Current user or null
 */
export const useUser = () => useAuthStore((state) => state.user);

/**
 * Selector: Check if user is anonymous
 * @returns True if current user is anonymous
 */
export const useIsAnonymous = () => useAuthStore((state) => state.isAnonymous);

/**
 * Selector: Get full auth state
 * @returns Complete auth state (user, isAnonymous, isLoading, error)
 */
export const useAuthState = () =>
  useAuthStore((state) => ({
    user: state.user,
    isAnonymous: state.isAnonymous,
    isLoading: state.isLoading,
    error: state.error,
  }));
