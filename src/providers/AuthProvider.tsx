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
import { migrateCategoryIds } from '@/services/migrations/migrateCategoryIds';
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

            // Run data migration: convert old transactions from category names to IDs
            // This is idempotent and safe to run on every sign-in
            try {
              const migratedCount = await migrateCategoryIds(user.uid);
              if (migratedCount > 0) {
                console.log(
                  `[AuthProvider] Migrated ${migratedCount} transactions to use category IDs`
                );
              }
            } catch (migrationError) {
              // Log error but don't block app initialization
              console.error('[AuthProvider] Migration failed:', migrationError);
            }

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

              // Run data migration: convert old transactions from category names to IDs
              try {
                const migratedCount = await migrateCategoryIds(anonymousUser.uid);
                if (migratedCount > 0) {
                  console.log(
                    `[AuthProvider] Migrated ${migratedCount} transactions for anonymous user`
                  );
                }
              } catch (migrationError) {
                console.error('[AuthProvider] Migration failed:', migrationError);
              }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - auth subscription handles all state changes

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
