/**
 * Sign In Modal Component
 *
 * Allows users with claimed accounts to sign in with email and password.
 * Features:
 * - Client-side validation with react-hook-form
 * - Email format validation (no password minimum length on sign-in)
 * - Error handling for incorrect credentials
 * - Loading states and success feedback
 * - Forgot password link
 * - Mobile-responsive design with accessibility features
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

interface SignInModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

interface SignInFormData {
  email: string;
  password: string;
}

/**
 * Modal component for signing in with email and password
 */
export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { signIn, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    getValues,
  } = useForm<SignInFormData>({
    mode: 'onChange', // Validate on change for real-time feedback
  });

  const handleClose = () => {
    reset();
    setSubmitError(null);
    setSubmitSuccess(false);
    setShowPassword(false);
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setForgotPasswordSuccess(false);
    setForgotPasswordError(null);
    onClose();
  };

  const onSubmit = async (data: SignInFormData) => {
    try {
      setSubmitError(null);
      await signIn(data.email, data.password);

      // Success!
      setSubmitSuccess(true);

      // Close modal and redirect to dashboard
      setTimeout(() => {
        handleClose();
        navigate('/');
      }, 800);
    } catch (error) {
      // Error already set in store, but we need to handle UI-specific errors
      const authError = error as { code?: string; getUserMessage?: () => string };

      // Set error message for display
      let errorMessage = 'Failed to sign in. Please try again.';

      if (authError.getUserMessage) {
        errorMessage = authError.getUserMessage();
      } else if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        // Security: use same message for both cases
        errorMessage = 'Email or password incorrect. Please try again.';
      } else if (authError.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please try again.';
      }

      setSubmitError(errorMessage);

      // Clear password field for security
      reset({ email: getValues('email'), password: '' });
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setForgotPasswordError('Please enter your email address');
      return;
    }

    try {
      setForgotPasswordError(null);
      const { authService } = await import('@/services/firebase/firebaseAuth');
      await authService.sendPasswordResetEmail(forgotPasswordEmail);

      setForgotPasswordSuccess(true);

      // Close forgot password view after showing success
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        setForgotPasswordSuccess(false);
      }, 3000);
    } catch (error) {
      const authError = error as { code?: string; getUserMessage?: () => string };
      let errorMessage = 'Failed to send reset email. Please try again.';

      if (authError.getUserMessage) {
        errorMessage = authError.getUserMessage();
      } else if (authError.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }

      setForgotPasswordError(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-lg bg-white shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sign-in-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Modal content */}
          <div className="p-6">
            {showForgotPassword ? (
              // Forgot Password View
              <>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="mb-4 flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-gray-900"
                  aria-label="Back to sign in"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Sign In
                </button>

                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Reset Password
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {forgotPasswordSuccess && (
                  <div className="mb-4 rounded-md bg-green-50 p-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <p className="text-sm font-medium text-green-800">
                        Password reset email sent. Check your inbox.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label htmlFor="forgot-password-email" className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="forgot-password-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    disabled={forgotPasswordSuccess}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50"
                    placeholder="your@email.com"
                  />
                </div>

                {forgotPasswordError && (
                  <div className="mb-4 rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{forgotPasswordError}</p>
                  </div>
                )}

                <button
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordSuccess}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {forgotPasswordSuccess ? 'Email Sent!' : 'Send Reset Link'}
                </button>
              </>
            ) : (
              // Sign In View
              <>
                <h2
                  id="sign-in-title"
                  className="mb-2 text-2xl font-bold text-gray-900"
                >
                  Sign In
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Sign in to access your financial data from any device.
                </p>

                {/* Success message */}
                {submitSuccess && (
                  <div className="mb-4 rounded-md bg-green-50 p-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <p className="text-sm font-medium text-green-800">
                        Signed in successfully! Redirecting...
                      </p>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  {/* Email field */}
                  <div className="mb-4">
                    <label
                      htmlFor="email"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      disabled={isLoading || submitSuccess}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <p
                        id="email-error"
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                      >
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password field */}
                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        disabled={isLoading || submitSuccess}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50"
                        {...register('password', {
                          required: 'Password is required',
                        })}
                        aria-invalid={errors.password ? 'true' : 'false'}
                        aria-describedby={errors.password ? 'password-error' : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading || submitSuccess}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p
                        id="password-error"
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                      >
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Forgot Password Link */}
                  <div className="mb-4 text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Error message */}
                  {submitError && (
                    <div className="mb-4 rounded-md bg-red-50 p-4">
                      <p className="text-sm text-red-800">{submitError}</p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading || submitSuccess}
                      className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!isValid || isLoading || submitSuccess}
                      className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="h-4 w-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Signing In...
                        </span>
                      ) : submitSuccess ? (
                        'Success!'
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SignInModal;
