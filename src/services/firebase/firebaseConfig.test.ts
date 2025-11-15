/**
 * Firebase Configuration Tests
 * Verifies Firebase SDK initialization and basic connectivity
 */

import { describe, it, expect } from 'vitest';
import { app, auth, db } from './firebaseConfig';

describe('Firebase Configuration', () => {
  it('should initialize Firebase app', () => {
    expect(app).toBeDefined();
    expect(app.name).toBe('[DEFAULT]');
  });

  it('should provide auth instance', () => {
    expect(auth).toBeDefined();
    expect(auth.app).toBe(app);
  });

  it('should provide firestore instance', () => {
    expect(db).toBeDefined();
    expect(db.app).toBe(app);
  });

  it('should have no user signed in initially', () => {
    expect(auth.currentUser).toBeNull();
  });
});
