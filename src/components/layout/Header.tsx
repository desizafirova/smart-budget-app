/**
 * Header Component
 *
 * Displays authentication status and user actions.
 * - Shows anonymous user banner and "Claim Account" button for anonymous users
 * - Shows user email and "Sign Out" button for authenticated users
 * - Mobile-first responsive design with Tailwind CSS
 */

import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/firebase/firebaseAuth';
import { useState } from 'react';
import { ClaimAccountModal } from '@/components/auth/ClaimAccountModal';

/**
 * Header component with auth status and actions
 */
export function Header() {
  const { user, isAnonymous, setLoading, setError, clearUser } = useAuthStore();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setLoading(true);
      await authService.signOut();
      clearUser();
    } catch (error) {
      const authError = error as { getUserMessage?: () => string };
      const errorMessage = authError.getUserMessage
        ? authError.getUserMessage()
        : 'Failed to sign out';
      setError(errorMessage);
    } finally {
      setIsSigningOut(false);
      setLoading(false);
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      {/* Anonymous user banner */}
      {isAnonymous && user && (
        <div className="bg-blue-50 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <svg
                className="h-5 w-5 flex-shrink-0 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-blue-900">
                You're using SmartBudget anonymously
              </p>
            </div>
            <button
              onClick={() => setShowClaimModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Claim your anonymous account"
            >
              Claim Account
            </button>
          </div>
        </div>
      )}

      {/* Authenticated user bar */}
      {!isAnonymous && user && (
        <div className="bg-gray-50 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 flex-shrink-0 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-900">
                {user.email || 'Authenticated User'}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Sign out of your account"
            >
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}

      {/* Main header content (logo, navigation, etc.) */}
      <div className="px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-xl font-bold text-gray-900">SmartBudget</h1>
          </div>
          {/* Navigation or other header items can be added here */}
        </div>
      </div>

      {/* Claim Account Modal */}
      <ClaimAccountModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />
    </header>
  );
}

export default Header;
