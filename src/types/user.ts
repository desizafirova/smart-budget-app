/**
 * User Type Definition
 *
 * Represents an authenticated user in SmartBudget.
 * Used throughout the application for authentication and authorization.
 */

/**
 * User interface representing an authenticated user
 */
export interface User {
  /** Unique user identifier (Firebase UID for anonymous or permanent accounts) */
  uid: string;

  /** User's email address (null for anonymous users) */
  email: string | null;

  /** User's display name (null for MVP/anonymous users) */
  displayName: string | null;

  /** Whether this is an anonymous account */
  isAnonymous: boolean;

  /** Account creation timestamp */
  createdAt: Date;

  /** Last sign-in timestamp */
  lastSignInAt: Date;
}
