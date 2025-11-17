/**
 * Authentication Provider Component
 *
 * Wraps the application to provide authentication state management.
 * - Subscribes to Firebase auth state changes
 * - Automatically signs in anonymously if no existing session
 * - Syncs auth state with Zustand store
 * - Shows loading spinner while auth state is initializing
 */

import { useEffect, useState } from 'react';
import { authService } from '@/services/firebase/firebaseAuth';
import { useAuthStore } from '@/stores/authStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { categoryService } from '@/services/categories.service';
import type { AuthError } from '@/types/errors';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component
 * Manages authentication lifecycle and state synchronization
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading, setError } = useAuthStore();
  const { subscribeToCategories, unsubscribeFromCategories } = useCategoryStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Subscribe to auth state changes
        unsubscribe = authService.onAuthStateChanged(async (user) => {
          if (user) {
            // User is signed in (anonymous or authenticated)
            setUser(user);

            // Seed default categories for new users (idempotent - safe to call every sign-in)
            try {
              await categoryService.seedDefaultCategories(user.uid);
            } catch (error) {
              // Log error but don't block app initialization
              console.error('Failed to seed default categories:', error);
            }

            // Subscribe to real-time category updates
            subscribeToCategories(user.uid);

            setLoading(false);
            setIsInitialized(true);
          } else {
            // No user signed in, attempt anonymous sign-in
            try {
              const anonymousUser = await authService.signInAnonymously();
              setUser(anonymousUser);

              // Seed default categories for new anonymous user
              try {
                await categoryService.seedDefaultCategories(anonymousUser.uid);
              } catch (categoryError) {
                // Log error but don't block app initialization
                console.error('Failed to seed default categories:', categoryError);
              }

              // Subscribe to real-time category updates
              subscribeToCategories(anonymousUser.uid);

              setLoading(false);
              setIsInitialized(true);
            } catch (error) {
              // Handle anonymous sign-in failure
              const authError = error as AuthError;
              const errorMessage = authError.getUserMessage
                ? authError.getUserMessage()
                : 'Failed to initialize authentication';

              setError(errorMessage);
              setLoading(false);
              setIsInitialized(true);
            }
          }
        });
      } catch (error) {
        // Handle unexpected errors during initialization
        const authError = error as AuthError;
        const errorMessage = authError.getUserMessage
          ? authError.getUserMessage()
          : 'Failed to initialize authentication';

        setError(errorMessage);
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Cleanup: Unsubscribe from auth state changes and categories on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      unsubscribeFromCategories();
    };
  }, [setUser, setLoading, setError, subscribeToCategories, unsubscribeFromCategories]);

  // Show loading spinner while initializing auth
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600">Loading SmartBudget...</p>
        </div>
      </div>
    );
  }

  // Render children once auth is initialized
  return <>{children}</>;
}

export default AuthProvider;
