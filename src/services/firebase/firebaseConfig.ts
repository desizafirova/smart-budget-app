/**
 * Firebase SDK Configuration
 *
 * Initializes Firebase app with environment variables and exports
 * auth and firestore instances for use by service implementations.
 *
 * Environment variables are loaded via Vite's import.meta.env
 * Configuration comes from .env file (not committed to git)
 */

import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

/**
 * Firebase configuration from environment variables
 * All variables must be prefixed with VITE_ for Vite to expose them
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Validate that all required environment variables are present
 */
const validateConfig = () => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missing = requiredVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(', ')}\n` +
      'Please ensure .env file exists and contains all required VITE_FIREBASE_* variables.'
    );
  }
};

// Validate configuration before initializing
validateConfig();

/**
 * Initialize Firebase app
 * This must happen before using any Firebase services
 */
export const app: FirebaseApp = initializeApp(firebaseConfig);

/**
 * Firebase Authentication instance
 * Used by FirebaseAuthService to implement IAuthService
 */
export const auth: Auth = getAuth(app);

/**
 * Firestore Database instance
 * Used by FirebaseDatabaseService to implement IDatabaseService
 */
export const db: Firestore = getFirestore(app);
