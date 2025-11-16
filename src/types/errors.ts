/**
 * Error Types for SmartBudget
 *
 * Defines custom error types and codes for handling application errors,
 * particularly authentication-related errors.
 */

/**
 * Authentication error codes
 * Maps common Firebase errors to application-specific codes
 */
export const AuthErrorCode = {
  // Anonymous sign-in errors
  ANONYMOUS_SIGN_IN_FAILED: 'ANONYMOUS_SIGN_IN_FAILED',
  ANONYMOUS_SIGN_IN_DISABLED: 'ANONYMOUS_SIGN_IN_DISABLED',

  // Email/password sign-in errors
  INVALID_EMAIL: 'INVALID_EMAIL',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  WRONG_PASSWORD: 'WRONG_PASSWORD',
  USER_DISABLED: 'USER_DISABLED',
  EMAIL_ALREADY_IN_USE: 'EMAIL_ALREADY_IN_USE',
  WEAK_PASSWORD: 'WEAK_PASSWORD',

  // Account linking errors
  ACCOUNT_LINKING_FAILED: 'ACCOUNT_LINKING_FAILED',
  CREDENTIAL_ALREADY_IN_USE: 'CREDENTIAL_ALREADY_IN_USE',
  NOT_ANONYMOUS: 'NOT_ANONYMOUS',

  // Session errors
  NO_USER_SIGNED_IN: 'NO_USER_SIGNED_IN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

/**
 * Custom authentication error class
 * Extends Error with additional context for auth failures
 */
export class AuthError extends Error {
  /** Error code for programmatic handling */
  public readonly code: AuthErrorCode;

  /** Original error that caused this AuthError (if any) */
  public readonly originalError?: unknown;

  /** Additional context or metadata about the error */
  public readonly context?: Record<string, unknown>;

  constructor(
    code: AuthErrorCode,
    message: string,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.originalError = originalError;
    this.context = context;

    // Maintains proper stack trace for where error was thrown (V8 engines only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }

  /**
   * Create AuthError from Firebase error
   * Maps Firebase error codes to AuthErrorCode enum
   */
  static fromFirebaseError(error: unknown): AuthError {
    // Handle Firebase error format
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message: string };
      const firebaseCode = firebaseError.code;

      // Map Firebase codes to AuthErrorCode
      let authCode: AuthErrorCode;
      let message: string;

      switch (firebaseCode) {
        case 'auth/invalid-email':
          authCode = AuthErrorCode.INVALID_EMAIL;
          message = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          authCode = AuthErrorCode.USER_NOT_FOUND;
          message = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          authCode = AuthErrorCode.WRONG_PASSWORD;
          message = 'Incorrect password';
          break;
        case 'auth/user-disabled':
          authCode = AuthErrorCode.USER_DISABLED;
          message = 'This account has been disabled';
          break;
        case 'auth/email-already-in-use':
          authCode = AuthErrorCode.EMAIL_ALREADY_IN_USE;
          message = 'Email address is already in use';
          break;
        case 'auth/weak-password':
          authCode = AuthErrorCode.WEAK_PASSWORD;
          message = 'Password is too weak';
          break;
        case 'auth/credential-already-in-use':
          authCode = AuthErrorCode.CREDENTIAL_ALREADY_IN_USE;
          message = 'This credential is already associated with a different account';
          break;
        case 'auth/operation-not-allowed':
          authCode = AuthErrorCode.ANONYMOUS_SIGN_IN_DISABLED;
          message = 'Anonymous sign-in is not enabled';
          break;
        case 'auth/network-request-failed':
          authCode = AuthErrorCode.NETWORK_ERROR;
          message = 'Network error occurred';
          break;
        default:
          authCode = AuthErrorCode.UNKNOWN_ERROR;
          message = firebaseError.message || 'An unknown error occurred';
      }

      return new AuthError(authCode, message, error, { firebaseCode });
    }

    // Handle generic errors
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new AuthError(AuthErrorCode.UNKNOWN_ERROR, message, error);
  }

  /**
   * Get user-friendly error message
   * Returns a message suitable for displaying to end users
   */
  getUserMessage(): string {
    switch (this.code) {
      case AuthErrorCode.INVALID_EMAIL:
        return 'Please enter a valid email address.';
      case AuthErrorCode.USER_NOT_FOUND:
        return 'No account found with this email. Please check your email or sign up.';
      case AuthErrorCode.WRONG_PASSWORD:
        return 'Incorrect password. Please try again.';
      case AuthErrorCode.USER_DISABLED:
        return 'This account has been disabled. Please contact support.';
      case AuthErrorCode.EMAIL_ALREADY_IN_USE:
        return 'This email is already registered. Please sign in instead.';
      case AuthErrorCode.WEAK_PASSWORD:
        return 'Password must be at least 6 characters long.';
      case AuthErrorCode.NETWORK_ERROR:
        return 'Network error. Please check your connection and try again.';
      case AuthErrorCode.NOT_ANONYMOUS:
        return 'Cannot link account: current user is not anonymous.';
      case AuthErrorCode.NO_USER_SIGNED_IN:
        return 'No user is signed in. Please sign in first.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}
