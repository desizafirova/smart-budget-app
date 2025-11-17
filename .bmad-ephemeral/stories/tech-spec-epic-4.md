# Epic Technical Specification: Intelligent Categorization

Date: 2025-11-17
Author: Desi
Epic ID: 4
Status: Draft

---

## Overview

Epic 4 transforms transaction organization from tedious manual work into an effortless, intelligent system that learns from user behavior and makes budgeting sustainable. This epic delivers the categorization foundation that enables the visual dashboard (Epic 5) to show meaningful spending patterns.

**Core Value:** Users spend minimal time categorizing transactions thanks to smart suggestions, pre-defined categories, and intuitive drag-and-drop reassignment. The system learns from user behavior, improving suggestion accuracy over time and making budgeting feel effortless rather than burdensome.

**Connection to PRD Goals:**
- Reduces cognitive load (FR-3: Intelligent Categorization)
- Supports "instant visual clarity moment" by organizing data for meaningful charts
- Enables 85%+ categorization accuracy success criterion through smart suggestions
- Delivers drag-and-drop ease per PRD UX principles

## Objectives and Scope

### In Scope

**Story 4.1: Pre-defined Category System**
- Ship default categories for all new users (10 expense, 5 income categories)
- Categories include name, type (income/expense), icon (Lucide icons), and color (UX spec palette)
- Categories stored in Firebase under user's account for customization
- Color consistency across all UI (charts, badges, transaction list) per UX design spec

**Story 4.2: Smart Category Suggestions**
- Keyword-based suggestion engine (e.g., "starbucks" → Food & Dining)
- User learning: track assignments, auto-suggest after 3+ identical patterns
- Display 1-3 suggestions as clickable chips in transaction form
- Suggestions appear within 300ms (per PRD performance requirement)

**Story 4.3: Drag-and-Drop Category Reassignment**
- Desktop: HTML5 drag-and-drop for transaction cards → category labels
- Mobile: Tap transaction → category picker modal (touch-friendly alternative)
- Visual feedback: highlight drop target, snap animation on drop
- Immediate Firebase update + UI refresh

**Story 4.4: Custom Categories**
- Users can create unlimited custom categories (name + type required, icon/color optional)
- Custom categories integrate with suggestion system
- Edit/delete custom categories with transaction reassignment flow
- Warning if deleting category with existing transactions

### Out of Scope (Deferred to Future Phases)

- **AI/ML-powered suggestions:** MVP uses simple keyword matching, not machine learning
- **Category budgets:** Budget setting per category (Phase 2 feature per PRD)
- **Category analytics:** Deep category insights (monthly trends, comparisons) beyond basic charts
- **Shared categories:** Multi-user category management (Phase 2: Multi-User Support)
- **Category hiding/archiving:** Users can delete but not hide default categories in MVP
- **Batch category reassignment:** Single transaction reassignment only (batch operations Phase 2)

## System Architecture Alignment

**Firebase Firestore Integration (ADR-001):**
- Categories stored in `users/{userId}/categories` subcollection
- Real-time sync via `onSnapshot()` for instant cross-device updates
- Offline persistence enabled (users can manage categories offline)
- NoSQL document structure fits category data model well

**State Management (Zustand - ADR-004):**
- `categoryStore.ts` manages category list, CRUD operations, and suggestions
- Memoized selectors for filtering by type (income/expense)
- Optimistic UI updates for instant feedback (<500ms target)

**Component Architecture:**
- `CategoryManager.tsx` (feature): Category list and management UI
- `CategoryChip.tsx` (component): Reusable category badge with icon/color
- `CategorySuggestions.tsx` (feature): Smart suggestion chips in transaction form
- `CategoryForm.tsx` (feature): Create/edit category modal

**Icon System (Lucide React - ADR-009):**
- Pre-defined category icons: ShoppingCart (Food), Car (Transport), Heart (Health), etc.
- Tree-shakable imports (~0.5KB per icon, fits <500KB bundle budget)
- Consistent stroke-based design matches Tailwind aesthetic
- 1,500+ icon library provides comprehensive coverage

**Drag-and-Drop (Desktop):**
- HTML5 Drag and Drop API for desktop transactions
- Accessibility: Keyboard alternative (Tab → Arrow keys → Enter to reassign)
- Mobile: Modal-based category picker (touch-optimized)

**Color System (UX Spec Section 3.1):**
- Food & Dining: `#f59e0b` (Amber)
- Transportation: `#3b82f6` (Blue)
- Shopping: `#8b5cf6` (Purple)
- Entertainment: `#ec4899` (Pink)
- Health: `#10b981` (Green)
- Education: `#6366f1` (Indigo)
- Rent/Housing: `#ef4444` (Red)
- Utilities: `#f97316` (Orange)
- Income categories: `#10b981` (Green)
- Other/Uncategorized: `#6b7280` (Gray)

**Constraints from Architecture:**
- Must use Firebase abstraction layer (`IDatabaseService`) for future migration flexibility
- Category operations must work offline (queue changes, sync on reconnect)
- All category colors must pass WCAG AA contrast (4.5:1 ratio on white)
- Suggestion latency <300ms (PRD requirement)

## Detailed Design

### Services and Modules

**Category Service (`src/services/categories.service.ts`)**

Handles all category-related Firebase operations through the abstraction layer pattern:

```typescript
// Interface for category operations
interface ICategoryService {
  // CRUD operations
  seedDefaultCategories(userId: string): Promise<void>;
  getCategories(userId: string): Promise<Category[]>;
  createCategory(userId: string, category: NewCategory): Promise<Category>;
  updateCategory(userId: string, categoryId: string, updates: Partial<Category>): Promise<void>;
  deleteCategory(userId: string, categoryId: string): Promise<void>;

  // Suggestion operations
  getSuggestedCategories(userId: string, description: string): Promise<Category[]>;
  recordCategoryAssignment(userId: string, description: string, categoryId: string): Promise<void>;
}
```

**Key Responsibilities:**
- Seed default categories on first user sign-in (Story 4.1)
- Manage category CRUD operations (Story 4.4)
- Implement keyword-based suggestion algorithm (Story 4.2)
- Track user assignment patterns for learning (Story 4.2)
- Enforce business rules (e.g., cannot delete category with transactions)

**Category Store (`src/stores/categoryStore.ts` - Zustand)**

Client-side state management for categories:

```typescript
interface CategoryStore {
  // State
  categories: Category[];
  loading: boolean;
  error: string | null;

  // Actions
  loadCategories: () => Promise<void>;
  addCategory: (category: NewCategory) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Selectors (memoized)
  getCategoryById: (id: string) => Category | undefined;
  getIncomeCategories: () => Category[];
  getExpenseCategories: () => Category[];
  getSuggestionsForDescription: (description: string) => Category[];
}
```

**Suggestion Engine Module (`src/utils/suggestions/category-suggestions.ts`)**

Implements keyword matching and user learning logic:

```typescript
// Phase 1: Static keyword matching
const DEFAULT_KEYWORDS: Record<string, string[]> = {
  'food-dining': ['starbucks', 'coffee', 'restaurant', 'groceries', 'food', 'lunch', 'dinner'],
  'transport': ['uber', 'lyft', 'gas', 'parking', 'transit', 'metro', 'taxi'],
  'shopping': ['amazon', 'target', 'walmart', 'mall', 'store'],
  'entertainment': ['netflix', 'spotify', 'movie', 'concert', 'game'],
  // ...more mappings
};

// Phase 2: User learning (Story 4.2)
interface UserAssignmentPattern {
  description: string; // normalized lowercase
  categoryId: string;
  count: number; // increments with each assignment
  lastUsed: Date;
}

function getSuggestedCategories(
  description: string,
  categories: Category[],
  userPatterns: UserAssignmentPattern[]
): Category[] {
  // 1. Check user patterns first (count >= 3)
  const learnedSuggestions = findLearnedPatterns(description, userPatterns);
  if (learnedSuggestions.length > 0) return learnedSuggestions.slice(0, 3);

  // 2. Fall back to keyword matching
  const keywordSuggestions = matchKeywords(description, DEFAULT_KEYWORDS, categories);
  return keywordSuggestions.slice(0, 3);
}
```

**UI Components:**

1. **CategoryManager.tsx** - Category list screen (Story 4.1, 4.4)
2. **CategoryChip.tsx** - Reusable badge component with icon + color
3. **CategorySuggestions.tsx** - Suggestion chips in transaction form (Story 4.2)
4. **CategoryForm.tsx** - Create/edit category modal (Story 4.4)
5. **CategorySelector.tsx** - Dropdown/combobox for category selection

### Data Models and Contracts

**Category Document (Firestore)**

```typescript
// Firestore path: users/{userId}/categories/{categoryId}
interface Category {
  id: string;                  // Auto-generated by Firestore
  userId: string;              // Owner (for security rules)
  name: string;                // "Food & Dining", "Rent", "Salary"
  type: 'income' | 'expense';  // Required for filtering
  icon: string;                // Lucide icon name: "ShoppingCart", "Car"
  color: string;               // Hex color: "#f59e0b"
  isDefault: boolean;          // true for pre-defined, false for custom
  createdAt: Date;             // Timestamp
  updatedAt: Date;             // Timestamp
}

// New category creation (client-side)
interface NewCategory {
  name: string;                // Required, 1-50 chars
  type: 'income' | 'expense';  // Required
  icon?: string;               // Optional, defaults to "Tag"
  color?: string;              // Optional, defaults to gray
}
```

**User Assignment Pattern (for learning - Firestore)**

```typescript
// Firestore path: users/{userId}/category-patterns/{patternId}
interface UserAssignmentPattern {
  id: string;                  // Auto-generated
  userId: string;              // Owner
  description: string;         // Normalized (lowercase, trimmed): "starbucks"
  categoryId: string;          // Reference to Category
  count: number;               // Increments each time pattern matches
  lastUsed: Date;              // Updated on each assignment
}
```

**Default Category Seed Data (`src/config/categories-seed.ts`)**

```typescript
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  // Income categories
  { name: 'Salary', type: 'income', icon: 'DollarSign', color: '#10b981', isDefault: true },
  { name: 'Freelance', type: 'income', icon: 'Briefcase', color: '#10b981', isDefault: true },
  { name: 'Investment', type: 'income', icon: 'TrendingUp', color: '#10b981', isDefault: true },
  { name: 'Gift', type: 'income', icon: 'Gift', color: '#10b981', isDefault: true },
  { name: 'Other Income', type: 'income', icon: 'Plus', color: '#10b981', isDefault: true },

  // Expense categories (with UX spec colors)
  { name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#f59e0b', isDefault: true },
  { name: 'Transport', type: 'expense', icon: 'Car', color: '#3b82f6', isDefault: true },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#8b5cf6', isDefault: true },
  { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#ec4899', isDefault: true },
  { name: 'Rent', type: 'expense', icon: 'Home', color: '#ef4444', isDefault: true },
  { name: 'Utilities', type: 'expense', icon: 'Zap', color: '#f97316', isDefault: true },
  { name: 'Health', type: 'expense', icon: 'Heart', color: '#10b981', isDefault: true },
  { name: 'Education', type: 'expense', icon: 'BookOpen', color: '#6366f1', isDefault: true },
  { name: 'Other Expense', type: 'expense', icon: 'Tag', color: '#6b7280', isDefault: true },
];
```

**Validation Rules:**

```typescript
// Category name validation
const CATEGORY_NAME_MIN = 1;
const CATEGORY_NAME_MAX = 50;
const CATEGORY_NAME_REGEX = /^[a-zA-Z0-9\s&-]+$/; // Alphanumeric + common symbols

// Custom category limits
const MAX_CUSTOM_CATEGORIES = 50; // Per user (prevent data bloat)

// Color validation (must be valid hex)
const COLOR_HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
```

### APIs and Interfaces

**Category Service API (Firebase Abstraction Layer)**

All operations use the `IDatabaseService` interface for future migration flexibility:

```typescript
// Create category (Story 4.4)
async function createCategory(userId: string, category: NewCategory): Promise<Category> {
  // 1. Validate input
  if (!category.name || category.name.length > CATEGORY_NAME_MAX) {
    throw new Error('Invalid category name');
  }

  // 2. Check custom category limit
  const existingCategories = await getCategories(userId);
  const customCount = existingCategories.filter(c => !c.isDefault).length;
  if (customCount >= MAX_CUSTOM_CATEGORIES) {
    throw new Error('Maximum custom categories reached (50)');
  }

  // 3. Create document via abstraction layer
  const newCategory: Category = {
    id: '', // Will be set by Firestore
    userId,
    name: category.name.trim(),
    type: category.type,
    icon: category.icon || 'Tag',
    color: category.color || '#6b7280',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await db.collection(`users/${userId}/categories`).add(newCategory);
  return { ...newCategory, id: docRef.id };
}

// Get suggestions (Story 4.2)
async function getSuggestedCategories(
  userId: string,
  description: string
): Promise<Category[]> {
  // 1. Load user patterns
  const patterns = await db
    .collection(`users/${userId}/category-patterns`)
    .where('description', '==', description.toLowerCase().trim())
    .orderBy('count', 'desc')
    .limit(3)
    .get();

  // 2. If learned patterns exist (count >= 3), return those
  if (patterns.docs.length > 0 && patterns.docs[0].data().count >= 3) {
    const categoryIds = patterns.docs.map(p => p.data().categoryId);
    const categories = await getCategories(userId);
    return categories.filter(c => categoryIds.includes(c.id));
  }

  // 3. Fall back to keyword matching
  const allCategories = await getCategories(userId);
  return matchKeywords(description, DEFAULT_KEYWORDS, allCategories);
}

// Record assignment (for learning - Story 4.2)
async function recordCategoryAssignment(
  userId: string,
  description: string,
  categoryId: string
): Promise<void> {
  const normalizedDesc = description.toLowerCase().trim();
  const patternRef = db.doc(`users/${userId}/category-patterns/${normalizedDesc}`);

  const pattern = await patternRef.get();

  if (pattern.exists) {
    // Increment count
    await patternRef.update({
      count: pattern.data().count + 1,
      lastUsed: new Date(),
    });
  } else {
    // Create new pattern
    await patternRef.set({
      userId,
      description: normalizedDesc,
      categoryId,
      count: 1,
      lastUsed: new Date(),
    });
  }
}

// Delete category (Story 4.4)
async function deleteCategory(userId: string, categoryId: string): Promise<void> {
  // 1. Check if category has transactions
  const transactions = await db
    .collection(`users/${userId}/transactions`)
    .where('categoryId', '==', categoryId)
    .limit(1)
    .get();

  if (!transactions.empty) {
    throw new Error('Cannot delete category with existing transactions. Reassign transactions first.');
  }

  // 2. Delete category document
  await db.doc(`users/${userId}/categories/${categoryId}`).delete();

  // 3. Clean up related patterns (optional, could be background job)
  const patterns = await db
    .collection(`users/${userId}/category-patterns`)
    .where('categoryId', '==', categoryId)
    .get();

  const batch = db.batch();
  patterns.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}
```

**Real-Time Sync API (Story 4.1)**

```typescript
// Subscribe to category changes (Zustand store)
function subscribeToCategories(userId: string, onUpdate: (categories: Category[]) => void) {
  return db.collection(`users/${userId}/categories`)
    .orderBy('name', 'asc')
    .onSnapshot(snapshot => {
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category));

      onUpdate(categories);
    });
}
```

**Firestore Security Rules (Epic 7.2 reference)**

```javascript
// Rules for categories collection
match /users/{userId}/categories/{categoryId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && request.auth.uid == userId
    && request.resource.data.name is string
    && request.resource.data.name.size() > 0
    && request.resource.data.name.size() <= 50
    && request.resource.data.type in ['income', 'expense'];
  allow update: if request.auth != null && request.auth.uid == userId;
  allow delete: if request.auth != null && request.auth.uid == userId;
}

// Rules for category patterns
match /users/{userId}/category-patterns/{patternId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### Workflows and Sequencing

**Flow 1: First User Sign-In (Seed Default Categories - Story 4.1)**

```
User signs in anonymously (Epic 2.1)
  ↓
Auth service creates user document in Firestore
  ↓
Trigger: Check if categories subcollection is empty
  ↓
IF empty:
  Call seedDefaultCategories(userId)
    ↓
    Batch write: Insert all DEFAULT_CATEGORIES with user's ID
    ↓
    Total: 15 categories (5 income, 10 expense)
    ↓
    Each category gets: id, userId, name, type, icon, color, isDefault=true, timestamps
  ↓
Categories available immediately via onSnapshot() real-time listener
  ↓
UI: Transaction form now shows category dropdown populated with 15 options
```

**Flow 2: Adding Transaction with Smart Suggestions (Story 4.2)**

```
User taps FAB → Quick-Add Modal opens
  ↓
User types amount: "$4.50"
  ↓
User types description: "starbucks" (onChange event)
  ↓
Debounced (300ms): Call getSuggestedCategories(userId, "starbucks")
  ↓
Suggestion engine:
  1. Check user patterns: Query category-patterns for "starbucks"
  2. IF pattern exists with count >= 3:
       Return that category (user's learned preference)
  3. ELSE:
       Match keywords: "starbucks" → DEFAULT_KEYWORDS['food-dining']
       Return "Food & Dining" category
  ↓
UI: Display suggestion chips below description field
  - [🍴 Food & Dining]
  ↓
User taps suggestion chip → Category auto-selected
  ↓
User taps "Save"
  ↓
Parallel operations:
  - Create transaction with categoryId = "food-dining"
  - Call recordCategoryAssignment(userId, "starbucks", "food-dining")
    → Increment pattern count (or create if first time)
  ↓
After 3 assignments: "starbucks" → "Food & Dining" pattern is learned
Next time user types "starbucks", suggestion appears instantly from user patterns
```

**Flow 3: Drag-and-Drop Category Reassignment (Story 4.3 - Desktop)**

```
User on Dashboard, viewing transaction list
  ↓
User sees transaction: "Starbucks - $4.50 - Entertainment" (wrong category)
  ↓
User drags transaction card (onDragStart event)
  - dataTransfer.setData('transactionId', tx.id)
  - Visual: Transaction card becomes semi-transparent
  ↓
User drags over "Food & Dining" category label (onDragOver event)
  - Visual: Category label highlights (border, background change)
  ↓
User drops on "Food & Dining" (onDrop event)
  - Extract transactionId from dataTransfer
  - Call updateTransaction(userId, transactionId, { categoryId: 'food-dining' })
  ↓
Firebase update triggers onSnapshot()
  ↓
UI updates instantly:
  - Transaction card moves to "Food & Dining" section (if grouped view)
  - Transaction card shows new category badge color (amber)
  - Dashboard chart updates (Entertainment segment shrinks, Food segment grows)
  - Animation: Smooth transition <500ms
  ↓
Background: Record assignment pattern (optional, for learning)
```

**Flow 4: Create Custom Category (Story 4.4)**

```
User on Categories screen
  ↓
User taps "+ Add Category" button
  ↓
CategoryForm modal opens
  - Field 1: Name (text input, required)
  - Field 2: Type (dropdown: Income/Expense, required)
  - Field 3: Icon (icon picker, optional, default: "Tag")
  - Field 4: Color (color picker, optional, default: gray)
  ↓
User fills form:
  - Name: "Meal Prep"
  - Type: Expense
  - Icon: "ChefHat"
  - Color: "#22c55e" (green)
  ↓
User taps "Save"
  ↓
Validation:
  - Name length 1-50 chars ✓
  - Type is valid enum ✓
  - Check custom category count < 50 ✓
  ↓
Call createCategory(userId, newCategory)
  ↓
Firestore: Add document to users/{userId}/categories
  ↓
Real-time listener triggers → categoryStore updates
  ↓
UI updates:
  - "Meal Prep" appears in category list
  - Transaction form dropdown now includes "Meal Prep"
  - Success toast: "Category created successfully"
  ↓
User can now assign transactions to "Meal Prep" category
```

**Flow 5: Delete Category with Transactions (Story 4.4 - Error Case)**

```
User on Categories screen
  ↓
User taps "Delete" on "Food & Dining" category
  ↓
Confirmation dialog: "Delete this category? This cannot be undone."
  ↓
User confirms deletion
  ↓
Call deleteCategory(userId, 'food-dining')
  ↓
Check: Query transactions with categoryId = 'food-dining'
  ↓
Found 47 transactions! ❌
  ↓
Throw error: "Cannot delete category with existing transactions"
  ↓
UI: Error toast displays
  - "Cannot delete Food & Dining. 47 transactions use this category."
  - "Reassign transactions first, then delete."
  ↓
User must:
  1. Reassign all 47 transactions to different category
  2. Then retry delete (will succeed if count = 0)
```

**Sequence Diagram: Smart Suggestion with Learning**

```
User          TransactionForm     SuggestionEngine     Firebase          CategoryStore
  |                 |                    |                 |                   |
  |--type desc----->|                    |                 |                   |
  |                 |--getSuggestions--->|                 |                   |
  |                 |                    |--query patterns-->                  |
  |                 |                    |<--patterns------                    |
  |                 |                    |                 |                   |
  |                 |                    |(match keywords) |                   |
  |                 |<--suggestions------|                 |                   |
  |<--show chips----|                    |                 |                   |
  |                 |                    |                 |                   |
  |--select chip--->|                    |                 |                   |
  |--save tx------->|                    |                 |                   |
  |                 |--create tx---------|---------------->|                   |
  |                 |--record pattern----|---------------->|                   |
  |                 |                    |<--tx created----|                   |
  |                 |                    |                 |--onSnapshot------>|
  |<--success-------|                    |                 |                   |
```

## Non-Functional Requirements

### Performance

**Suggestion Response Time (Critical - Story 4.2):**
- **Target:** <300ms from description input to suggestion display (95th percentile)
- **Rationale:** Per PRD FR-3.2, suggestions must appear quickly to avoid interrupting user flow
- **Implementation:**
  - Debounce input to 300ms (prevents excessive queries)
  - Index `category-patterns` collection on `description` field
  - Cache recent patterns in-memory (Zustand store)
  - Keyword matching algorithm: O(1) lookup via hash map
- **Measurement:** Performance monitoring on `getSuggestedCategories()` function calls
- **Acceptance:** 95% of suggestion requests complete in <300ms

**Category CRUD Operations:**
- **Create category:** <1 second (95th percentile)
- **Load categories:** <500ms on first app load (includes Firebase query + onSnapshot setup)
- **Update category:** <500ms (optimistic UI + background sync)
- **Delete category:** <1 second (includes transaction check query)

**Real-Time Sync:**
- **Category changes propagate across devices:** <3 seconds (Firebase onSnapshot)
- **Offline-to-online sync:** <5 seconds after reconnection

**Bundle Size Impact:**
- **Category components:** <30KB (minified + gzipped)
- **Lucide icons:** ~0.5KB per icon × 15 default icons = ~7.5KB
- **Total contribution to <500KB bundle budget:** ~37.5KB (7.5% of budget)

### Security

**Data Access Control (Firebase Security Rules):**
- **Rule:** Users can only read/write categories in their own subcollection
  ```javascript
  allow read, write: if request.auth.uid == userId;
  ```
- **Enforcement:** Firestore Security Rules (server-side, cannot be bypassed)
- **Testing:** Security rules unit tests in Epic 7.2

**Input Validation:**
- **Category name:** Sanitize to prevent XSS (no script tags, HTML entities escaped)
- **Regex validation:** `/^[a-zA-Z0-9\s&-]+$/` (alphanumeric + safe symbols only)
- **Max length:** 50 characters (prevents database bloat)
- **Color hex validation:** Must match `/^#[0-9A-Fa-f]{6}$/`

**Pattern Storage Security:**
- **User patterns contain no PII:** Only normalized descriptions (e.g., "starbucks", not "John's starbucks purchase")
- **Descriptions are lowercase and trimmed:** Prevents fingerprinting via typing patterns

**HTTPS Enforcement:**
- All Firebase communication over TLS 1.2+ (enforced by Firebase SDK)

### Reliability/Availability

**Offline Support (Story 4.1, 4.2, 4.3, 4.4):**
- **Categories cached locally:** Firebase offline persistence enabled
- **CRUD operations work offline:** Changes queued, sync when online
- **Suggestion engine works offline:** Uses cached patterns + keywords (no network required)
- **User experience:** Clear offline indicator, no functionality loss

**Error Handling:**
- **Network errors:** Retry with exponential backoff (Firebase SDK handles automatically)
- **Quota exceeded:** Graceful degradation (show cached data, prevent new writes)
- **Invalid data:** Client-side validation prevents bad data from reaching Firestore

**Data Consistency:**
- **Optimistic UI updates:** Show changes immediately, rollback if Firebase rejects
- **Conflict resolution:** Last-write-wins (acceptable for category management)
- **Transaction integrity:** Delete category checks for existing transactions before proceeding

**Graceful Degradation:**
- **If suggestion engine fails:** Fall back to showing all categories in dropdown
- **If patterns cannot load:** Use keyword matching only (static, no network required)
- **If custom category limit reached:** Show clear error, allow user to delete old categories

### Observability

**Logging:**
- **Category creation:** Log `categoryCreated` event with category type (income/expense)
- **Suggestion usage:** Log `suggestionAccepted` event when user taps suggestion chip
- **Learning milestone:** Log `patternLearned` event when pattern count reaches 3
- **Errors:** Log all Firebase errors with context (operation, userId, categoryId)

**Metrics:**
- **Suggestion accuracy:** % of transactions where user accepted suggestion vs manual selection
- **Custom category adoption:** % of users who create custom categories
- **Pattern learning rate:** Average time to reach 3 assignments per pattern
- **Category CRUD operations:** Count by type (create, update, delete)

**Performance Monitoring:**
- **Suggestion latency:** Track p50, p95, p99 for `getSuggestedCategories()`
- **Firebase query times:** Monitor slow queries (>500ms)
- **Offline sync queue depth:** Alert if queue exceeds 100 pending operations

**Analytics Events:**
```typescript
// Track suggestion usage
analytics.logEvent('suggestion_accepted', {
  category: 'Food & Dining',
  source: 'learned_pattern', // or 'keyword_match'
  latency_ms: 245,
});

// Track custom category creation
analytics.logEvent('custom_category_created', {
  category_type: 'expense',
  has_custom_icon: true,
  has_custom_color: true,
});
```

**Error Tracking (Sentry or similar):**
- Capture exceptions in category service methods
- Include context: userId (hashed), operation type, error message
- Alert on error rate spikes (>1% of requests failing)

## Dependencies and Integrations

**Firebase Firestore (ADR-001):**
- **Version:** Firebase JS SDK v9.x (modular)
- **Usage:** Category storage, pattern storage, real-time sync
- **Collections:**
  - `users/{userId}/categories` - Category documents
  - `users/{userId}/category-patterns` - User learning patterns
- **Dependencies:** Epic 1.2 (Firebase integration must be complete)
- **Offline:** Enabled via `enableIndexedDbPersistence()`

**Zustand (ADR-004):**
- **Version:** ^4.5.0
- **Usage:** `categoryStore.ts` for client-side state management
- **Dependencies:** Epic 1.1 (Zustand installation)
- **Integration:** Subscribes to Firebase `onSnapshot()` for real-time updates

**Lucide React (ADR-009):**
- **Version:** ^0.344.0 (latest stable)
- **Usage:** Category icons (15 default icons + optional custom icons)
- **Import strategy:** Tree-shakable named imports
  ```typescript
  import { Utensils, Car, ShoppingBag, Film, Home } from 'lucide-react';
  ```
- **Bundle impact:** ~0.5KB per icon × 15 = ~7.5KB
- **Dependencies:** Epic 1.1 (Lucide installation)

**React Hook Form (ADR-007):**
- **Version:** ^7.50.0
- **Usage:** CategoryForm validation (Story 4.4)
- **Integration:** Handles category name, type, icon, color inputs
- **Dependencies:** Epic 1.1 (React Hook Form installation)

**Tailwind CSS (ADR-002):**
- **Version:** v4.1
- **Usage:** Category color badges, drag-and-drop visual feedback
- **Custom colors:** UX spec palette integrated into `tailwind.config.js`
- **Dependencies:** Epic 1.1 (Tailwind installation)

**Transaction Store Integration:**
- **Dependency:** Epic 3 (Transaction Management) must be complete
- **Usage:** Story 4.3 drag-and-drop updates transaction categoryId
- **API:** `updateTransaction(userId, txId, { categoryId })` from transactionStore

**Dashboard Chart Integration:**
- **Dependency:** Epic 5 (Visual Dashboard) will consume category data
- **Usage:** Charts group transactions by category, use category colors
- **API:** Charts subscribe to categoryStore for color/icon lookups

**Keyboard Event Handling (Accessibility):**
- **Library:** React built-in event handlers
- **Usage:** Keyboard alternative for drag-and-drop (Story 4.3)
- **Implementation:** Tab to transaction → Arrow keys to select category → Enter to assign

**Package Dependencies Summary:**
```json
{
  "dependencies": {
    "firebase": "^9.x",           // Firestore + Auth (ADR-001)
    "zustand": "^4.5.0",          // State management (ADR-004)
    "lucide-react": "^0.344.0",   // Icons (ADR-009)
    "react-hook-form": "^7.50.0", // Form validation (ADR-007)
  }
}
```

**External Service Dependencies:**
- **Firebase Project:** Development and production instances configured
- **Firestore Indexes:** Composite index on `userId + description` for pattern queries (auto-created by Firebase)
- **Security Rules:** Deployed via `firebase deploy --only firestore:rules`

## Acceptance Criteria (Authoritative)

Epic 4 is considered complete when all 4 stories meet their acceptance criteria and the following epic-level criteria are satisfied:

### Epic-Level Acceptance Criteria

**AC-E4.1: Pre-defined Categories Available**
- **Given** a new user signs in for the first time
- **When** they navigate to add a transaction
- **Then** they see 15 pre-defined categories in the category dropdown (5 income, 10 expense)
- **And** each category displays correct icon and color per UX spec

**AC-E4.2: Smart Suggestions Work**
- **Given** a user types "starbucks" in transaction description
- **When** suggestions appear (<300ms)
- **Then** "Food & Dining" category is suggested
- **And** after user assigns "starbucks" to "Food & Dining" 3 times
- **Then** future "starbucks" entries auto-suggest "Food & Dining" from learned patterns

**AC-E4.3: Drag-and-Drop Reassignment**
- **Given** a user on desktop viewing transaction list
- **When** they drag a transaction card to a different category label
- **Then** the transaction's category updates immediately
- **And** the dashboard chart reflects the change (<500ms animation)
- **And** the change syncs to Firebase

**AC-E4.4: Custom Categories Functional**
- **Given** a user wants a custom category
- **When** they create "Meal Prep" with custom icon and color
- **Then** "Meal Prep" appears in all category dropdowns
- **And** transactions can be assigned to "Meal Prep"
- **And** dashboard charts use the custom color for "Meal Prep"

**AC-E4.5: Cross-Device Sync**
- **Given** a user creates a custom category on mobile
- **When** they open the app on desktop within 5 seconds
- **Then** the custom category appears on desktop
- **And** all category changes sync in real-time via Firebase onSnapshot

**AC-E4.6: Offline Support**
- **Given** a user is offline
- **When** they create/edit/delete categories
- **Then** all operations work normally with cached data
- **And** changes queue for sync when back online
- **And** suggestions still work using cached patterns + keywords

### Story-Level Acceptance Criteria (from Epics.md)

**Story 4.1: Pre-defined Category System**

1. **Default categories seeded on first sign-in**
   - 15 total categories: 5 income + 10 expense
   - Each has name, type, icon (Lucide), color (UX spec), isDefault=true

2. **Categories available in transaction form**
   - Category dropdown shows all 15 categories
   - Icons and colors display correctly

3. **Color consistency**
   - Category colors match UX spec (Food=#f59e0b, Transport=#3b82f6, etc.)
   - Same colors used in charts, badges, transaction list

**Story 4.2: Smart Category Suggestions**

1. **Keyword matching works**
   - "starbucks" → suggests "Food & Dining"
   - "uber" → suggests "Transport"
   - "netflix" → suggests "Entertainment"

2. **Suggestions appear quickly**
   - <300ms from description input to chip display (95th percentile)

3. **User learning works**
   - After assigning "starbucks" to "Food & Dining" 3 times
   - Pattern count increments in `category-patterns` collection
   - Future "starbucks" entries suggest from learned pattern (not keywords)

4. **Suggestions displayed as chips**
   - 1-3 suggestion chips below description field
   - Tap chip auto-selects category

**Story 4.3: Drag-and-Drop Category Reassignment**

1. **Desktop drag-and-drop works**
   - Drag transaction card to category label
   - Visual feedback: card becomes semi-transparent, label highlights
   - Drop updates transaction categoryId in Firebase

2. **Mobile touch alternative works**
   - Tap transaction → category picker modal opens
   - Select new category → transaction updates

3. **UI updates instantly**
   - Transaction card shows new category badge color
   - Dashboard chart updates (<500ms animation)

4. **Keyboard accessibility**
   - Tab to transaction → Arrow keys to select category → Enter to assign

**Story 4.4: Custom Categories**

1. **Create custom category**
   - "+ Add Category" button opens CategoryForm modal
   - Required fields: name (1-50 chars), type (income/expense)
   - Optional fields: icon, color
   - Custom category saved to Firebase

2. **Custom categories integrate**
   - Appear in transaction form dropdown
   - Work with suggestion system
   - Display in dashboard charts with custom colors

3. **Edit custom category**
   - Tap custom category → edit modal opens
   - All fields editable
   - Updates sync to Firebase

4. **Delete custom category**
   - Delete button shows confirmation dialog
   - If category has transactions → error message
   - If no transactions → category deleted + patterns cleaned up

5. **Custom category limit**
   - Max 50 custom categories per user
   - Exceed limit → clear error message

## Traceability Mapping

This table maps Epic 4 acceptance criteria to PRD requirements, architecture components, and test coverage:

| AC ID | Acceptance Criteria | PRD Requirement | Architecture Component | Test Type | Test Location |
|-------|---------------------|-----------------|------------------------|-----------|---------------|
| **AC-E4.1** | Pre-defined categories available | FR-3.1 | `categories.service.ts`<br>`categoryStore.ts`<br>`categories-seed.ts` | Unit<br>Integration<br>E2E | `categories.service.test.ts`<br>`categoryStore.test.ts`<br>`e2e/category-seeding.spec.ts` |
| **AC-E4.2** | Smart suggestions work | FR-3.2 | `category-suggestions.ts`<br>`CategorySuggestions.tsx` | Unit<br>Integration<br>E2E | `category-suggestions.test.ts`<br>`CategorySuggestions.test.tsx`<br>`e2e/smart-suggestions.spec.ts` |
| **AC-E4.3** | Drag-and-drop reassignment | FR-3.3<br>UX Spec 7.4 | `TransactionListItem.tsx`<br>HTML5 Drag API | Component<br>E2E | `TransactionListItem.test.tsx`<br>`e2e/drag-drop.spec.ts` |
| **AC-E4.4** | Custom categories functional | FR-3.4 | `categories.service.ts`<br>`CategoryForm.tsx` | Unit<br>Component<br>E2E | `categories.service.test.ts`<br>`CategoryForm.test.tsx`<br>`e2e/custom-categories.spec.ts` |
| **AC-E4.5** | Cross-device sync | FR-6.1<br>ADR-001 | Firebase `onSnapshot()`<br>`categoryStore.ts` | Integration<br>E2E | `categoryStore.test.ts`<br>`e2e/category-sync.spec.ts` |
| **AC-E4.6** | Offline support | FR-6.2<br>ADR-001 | Firebase offline persistence | Integration<br>E2E | `categoryStore.test.ts`<br>`e2e/offline-categories.spec.ts` |
| **Story 4.1** | Default categories seeded | FR-3.1 | `seedDefaultCategories()` | Unit | `categories.service.test.ts` |
| **Story 4.2** | Keyword matching | FR-3.2 | `matchKeywords()` | Unit | `category-suggestions.test.ts` |
| **Story 4.2** | User learning (3+ patterns) | FR-3.2 | `recordCategoryAssignment()`<br>`category-patterns` collection | Integration | `categories.service.test.ts` |
| **Story 4.2** | Suggestion latency <300ms | NFR Performance | `getSuggestedCategories()` | Performance | `performance/suggestion-latency.test.ts` |
| **Story 4.3** | Desktop drag-and-drop | FR-3.3 | `onDragStart/onDrop` handlers | Component<br>E2E | `TransactionListItem.test.tsx`<br>`e2e/drag-drop.spec.ts` |
| **Story 4.3** | Mobile category picker | FR-3.3<br>UX Spec | `CategoryPickerModal.tsx` | Component<br>E2E | `CategoryPickerModal.test.tsx`<br>`e2e/mobile-reassign.spec.ts` |
| **Story 4.4** | Create custom category | FR-3.4 | `createCategory()` | Unit<br>Integration | `categories.service.test.ts` |
| **Story 4.4** | Custom category limit (50) | NFR Reliability | `createCategory()` validation | Unit | `categories.service.test.ts` |
| **Story 4.4** | Delete with transactions check | FR-3.4 | `deleteCategory()` | Unit<br>Integration | `categories.service.test.ts` |

**Traceability to Architecture Decisions:**

| ADR | Decision | Impact on Epic 4 | Traced in Section |
|-----|----------|------------------|-------------------|
| ADR-001 | Firebase as BaaS | Category storage, real-time sync, offline persistence | Dependencies, Detailed Design |
| ADR-002 | Tailwind CSS v4.1 | Category color badges, drag-and-drop visual feedback | Dependencies, UX alignment |
| ADR-004 | Zustand for state | `categoryStore.ts` manages client-side category state | Detailed Design |
| ADR-007 | React Hook Form | CategoryForm validation (Story 4.4) | Dependencies |
| ADR-009 | Lucide React icons | Category icons (15 default + custom) | Dependencies, Data Models |

**Traceability to UX Design Spec:**

| UX Spec Section | Requirement | Epic 4 Implementation |
|-----------------|-------------|----------------------|
| Section 3.1: Color System | Category colors defined | Data Models: DEFAULT_CATEGORIES with exact hex codes |
| Section 6.2: CategoryChip component | Reusable category badge | UI Components: CategoryChip.tsx |
| Section 7.4: Drag-and-drop pattern | Desktop category reassignment | Workflows: Flow 3 (Drag-and-Drop) |
| Section 8.2: Keyboard navigation | Accessibility for drag-and-drop | NFR Accessibility, Dependencies |

## Risks, Assumptions, Open Questions

### Risks

**RISK-E4.1: Suggestion accuracy may be low initially**
- **Severity:** Medium
- **Probability:** High (before users build patterns)
- **Impact:** Users manually select categories, reduces "effortless" goal
- **Mitigation:**
  - Comprehensive keyword dictionary covering common merchants/descriptions
  - Clear UI that suggestions are optional (don't force acceptance)
  - Track suggestion acceptance rate, iterate on keywords based on data
- **Owner:** Dev team + Product (iterate on keyword dictionary)

**RISK-E4.2: Keyword matching in wrong language**
- **Severity:** Medium
- **Probability:** Medium (if user enters non-English descriptions)
- **Impact:** Suggestions fail for non-English users
- **Mitigation:**
  - MVP: English keywords only (documented limitation)
  - Phase 2: Internationalization with locale-specific keywords
  - User learning still works regardless of language (learns patterns)
- **Owner:** Product (roadmap i18n for Phase 2)

**RISK-E4.3: Pattern learning data grows indefinitely**
- **Severity:** Low
- **Probability:** Low (only unique descriptions create patterns)
- **Impact:** Firestore storage costs increase, query performance degrades
- **Mitigation:**
  - Monitor pattern count per user (alert if >1000)
  - Implement pattern cleanup: delete patterns unused for >6 months (Phase 2)
  - Firestore pricing: $0.18/GB storage, patterns are small (~50 bytes each)
- **Owner:** Dev team (monitoring), Product (decide cleanup policy)

**RISK-E4.4: Drag-and-drop not intuitive for all users**
- **Severity:** Low
- **Probability:** Medium (not all users familiar with drag-and-drop)
- **Impact:** Users don't discover reassignment feature
- **Mitigation:**
  - Provide keyboard alternative (documented in UX spec)
  - Mobile: Use modal picker instead (more familiar pattern)
  - Consider onboarding tooltip: "Drag transactions to reassign category" (Phase 2)
- **Owner:** UX design, Dev team

**RISK-E4.5: Custom category colors may violate WCAG contrast**
- **Severity:** Medium
- **Probability:** Medium (users pick poor color choices)
- **Impact:** Accessibility failure, text unreadable on category badges
- **Mitigation:**
  - Validate color picker: only allow colors with ≥4.5:1 contrast on white
  - Provide pre-selected palette of WCAG-compliant colors
  - Test in Story 7.4 (Accessibility - Color Contrast)
- **Owner:** Dev team (validation), Epic 7.4 (testing)

### Assumptions

**ASSUME-E4.1: Users have stable internet for pattern sync**
- **Assumption:** Category patterns sync reliably across devices
- **Validation:** Firebase offline persistence + queue handles intermittent connectivity
- **Fallback:** Patterns cached locally, work offline with keyword fallback
- **Status:** Safe assumption (Firebase SDK handles this)

**ASSUME-E4.2: 15 default categories cover 80%+ of use cases**
- **Assumption:** Most users won't need custom categories immediately
- **Validation:** Epics.md PRD research indicates these are standard categories
- **Fallback:** Users can create custom categories (Story 4.4)
- **Status:** Reasonable assumption, trackable via analytics (custom category creation rate)

**ASSUME-E4.3: Keyword matching is "good enough" for MVP**
- **Assumption:** Simple keyword matching provides value without ML/AI complexity
- **Validation:** PRD explicitly defers AI/ML to Phase 2
- **Fallback:** User learning (patterns) improves over time
- **Status:** Aligned with PRD scope, acceptable for MVP

**ASSUME-E4.4: Lucide icons cover all category needs**
- **Assumption:** 1,500+ Lucide icons include suitable icons for any custom category
- **Validation:** ADR-009 rationale documents comprehensive coverage
- **Fallback:** Default "Tag" icon if user can't find suitable icon
- **Status:** Safe assumption (Lucide is very comprehensive)

**ASSUME-E4.5: Users understand category concept**
- **Assumption:** Users are familiar with categorizing expenses (common budgeting pattern)
- **Validation:** Standard practice in all budgeting apps (Mint, YNAB, etc.)
- **Fallback:** Brief onboarding tooltip explaining categories (Phase 2 if needed)
- **Status:** Very safe assumption (universal budgeting concept)

### Open Questions

**QUESTION-E4.1: Should category learning be opt-in or automatic?**
- **Context:** Some users may not want app "learning" their patterns
- **Options:**
  1. Automatic (current design) - learns by default
  2. Opt-in - user enables learning in settings
  3. Transparent - show "Smart suggestions enabled" badge
- **Impact:** Affects privacy perception, suggestion accuracy
- **Decision needed by:** Story 4.2 implementation start
- **Recommendation:** Automatic with transparency (show "learned from your history" badge on suggestions)

**QUESTION-E4.2: How to handle category name conflicts?**
- **Context:** User creates "Food" custom category when "Food & Dining" already exists
- **Options:**
  1. Allow duplicates (current design)
  2. Check for exact name match, reject duplicates
  3. Check for similar names (fuzzy match), warn user
- **Impact:** User experience, database design
- **Decision needed by:** Story 4.4 implementation start
- **Recommendation:** Allow duplicates for MVP (users may want "Food" vs "Food & Dining" distinction)

**QUESTION-E4.3: Should deleted categories be soft-deleted or hard-deleted?**
- **Context:** Hard delete (current design) is permanent, soft delete allows recovery
- **Options:**
  1. Hard delete (current) - permanent removal
  2. Soft delete - set `deletedAt` flag, hide from UI, allow recovery
- **Impact:** Database design, undo functionality
- **Decision needed by:** Story 4.4 implementation start
- **Recommendation:** Hard delete for MVP (simpler), consider soft delete in Phase 2

**QUESTION-E4.4: Should category patterns be shared across users (anonymized)?**
- **Context:** Aggregate patterns could improve suggestions for all users
- **Options:**
  1. User-specific only (current design) - each user learns independently
  2. Shared patterns - anonymized "starbucks" → "Food & Dining" pattern used globally
- **Impact:** Privacy, suggestion accuracy, complexity
- **Decision needed by:** Story 4.2 implementation (could add later)
- **Recommendation:** User-specific for MVP (privacy-first), consider shared patterns in Phase 2 with opt-in

## Test Strategy Summary

### Unit Tests (Vitest - ADR-010)

**Coverage Target:** ≥80% for category service and suggestion logic

**Test Files:**
1. **`categories.service.test.ts`**
   - `seedDefaultCategories()` creates 15 categories
   - `createCategory()` validates input, enforces 50 category limit
   - `deleteCategory()` checks for transactions before deleting
   - `getSuggestedCategories()` returns keyword matches
   - `recordCategoryAssignment()` increments pattern count

2. **`category-suggestions.test.ts`**
   - `matchKeywords()` returns correct categories for known descriptions
   - `findLearnedPatterns()` prioritizes patterns with count ≥ 3
   - Fuzzy matching handles typos ("starbks" → "starbucks")
   - Returns max 3 suggestions

3. **`categoryStore.test.ts`** (Zustand store)
   - `loadCategories()` fetches from Firebase
   - `addCategory()` optimistic update + Firebase sync
   - `getCategoryById()` selector returns correct category
   - `getExpenseCategories()` filters by type

**Mocking Strategy:**
- Mock Firebase SDK (`@firebase/firestore`) using Vitest mocks
- Mock data: `mockCategory`, `mockPattern` fixtures in `src/test/fixtures/`

### Component Tests (React Testing Library)

**Coverage Target:** All category UI components

**Test Files:**
1. **`CategoryChip.test.tsx`**
   - Renders with correct icon and color
   - Displays category name
   - Handles click events

2. **`CategorySuggestions.test.tsx`**
   - Displays suggestion chips when suggestions available
   - Hides when no suggestions
   - Calls `onSelect()` when chip clicked
   - Debounces description input (300ms)

3. **`CategoryForm.test.tsx`**
   - Validates required fields (name, type)
   - Shows error messages for invalid input
   - Submits valid category
   - Icon picker works

4. **`CategoryManager.test.tsx`**
   - Displays list of categories grouped by type
   - "+ Add Category" button opens form
   - Edit category button opens form with pre-filled data
   - Delete button shows confirmation dialog

5. **`TransactionListItem.test.tsx`** (drag-and-drop)
   - `onDragStart` sets transaction ID in dataTransfer
   - Visual feedback during drag (class changes)

### Integration Tests

**Test Firebase + Zustand integration:**

**Test File:** `integration/category-flow.test.ts`

**Scenarios:**
1. **First user sign-in flow:**
   - Create anonymous user → Check categories subcollection empty → Call `seedDefaultCategories()` → Verify 15 categories in Firebase
2. **Category creation flow:**
   - Create custom category → Verify in Firebase → Verify `onSnapshot()` updates store
3. **Suggestion with learning:**
   - Create transaction with "starbucks" → Assign to "Food & Dining" → Repeat 3 times → Verify pattern count = 3 → Get suggestions → Verify "Food & Dining" returned from patterns (not keywords)

**Environment:** Firebase Emulator Suite (local testing, no network required)

### End-to-End Tests (Playwright - ADR-011)

**Coverage Target:** All user-facing category workflows

**Test Files:**
1. **`e2e/category-seeding.spec.ts`** (Story 4.1)
   - First-time user sees 15 default categories in dropdown
   - Categories display correct icons and colors

2. **`e2e/smart-suggestions.spec.ts`** (Story 4.2)
   - Type "starbucks" → Suggestion chip appears <300ms → Tap chip → Category selected
   - Assign "starbucks" 3 times → Next time suggestion comes from learned pattern

3. **`e2e/drag-drop.spec.ts`** (Story 4.3 - Desktop)
   - Drag transaction to category label → Transaction updates → Chart animates
   - Keyboard: Tab to transaction → Arrow keys → Enter → Category reassigned

4. **`e2e/custom-categories.spec.ts`** (Story 4.4)
   - Create custom category → Appears in dropdown → Assign transaction → Chart shows custom color
   - Edit custom category → Changes reflected
   - Delete category with transactions → Error message
   - Delete empty category → Succeeds

5. **`e2e/category-sync.spec.ts`** (Cross-device)
   - Create category on "mobile" viewport → Switch to "desktop" viewport → Category appears within 5 seconds

6. **`e2e/offline-categories.spec.ts`** (Offline support)
   - Go offline → Create category → Category appears (cached) → Go online → Syncs to Firebase

**Test Environment:** Headless Chromium + Firefox + WebKit (cross-browser)

### Performance Tests

**Test File:** `performance/suggestion-latency.test.ts`

**Metrics:**
- Measure `getSuggestedCategories()` execution time
- Target: p95 <300ms
- Simulate 100 concurrent suggestion requests
- Verify no memory leaks (pattern cache doesn't grow indefinitely)

**Methodology:**
```typescript
import { performance } from 'perf_hooks';

test('suggestion latency <300ms (p95)', async () => {
  const latencies: number[] = [];

  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    await getSuggestedCategories(userId, 'starbucks');
    const end = performance.now();
    latencies.push(end - start);
  }

  const p95 = calculatePercentile(latencies, 95);
  expect(p95).toBeLessThan(300);
});
```

### Accessibility Tests

**Tool:** Axe DevTools in Playwright E2E tests

**Coverage:**
- CategoryForm: Keyboard navigation, label associations, ARIA attributes
- CategoryChip: Color contrast ≥4.5:1
- Drag-and-drop: Keyboard alternative functional
- Category picker modal: Focus trap, Esc to close

**Example:**
```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('CategoryForm is accessible', async ({ page }) => {
  await page.goto('/categories');
  await page.click('text=Add Category');

  await injectAxe(page);
  await checkA11y(page, '.category-form-modal', {
    rules: {
      'color-contrast': { enabled: true },
      'label': { enabled: true },
      'keyboard': { enabled: true },
    },
  });
});
```

### Test Execution Plan

**Pre-merge (CI Pipeline):**
1. Run all unit tests (Vitest) - ~30 seconds
2. Run component tests (React Testing Library) - ~1 minute
3. Run E2E critical paths (Playwright) - ~3 minutes
   - Category seeding
   - Smart suggestions
   - Custom category creation

**Post-merge (Nightly):**
1. Run full E2E suite (all browsers) - ~15 minutes
2. Run performance tests - ~5 minutes
3. Run accessibility audit - ~10 minutes

**Manual Testing (Before Story Completion):**
- Mobile device testing (iOS Safari, Android Chrome)
- Screen reader testing (VoiceOver, NVDA)
- Drag-and-drop UX validation (real users, not automated)

### Definition of Done (DoD) for Epic 4

- ✅ All 4 stories implemented and tested
- ✅ Unit test coverage ≥80% for category service and suggestion logic
- ✅ All E2E tests passing (3 browsers)
- ✅ Performance benchmarks met (<300ms suggestion latency)
- ✅ Accessibility audit passed (Axe DevTools, no critical violations)
- ✅ Firebase Security Rules tested and deployed
- ✅ Code review completed
- ✅ Documentation updated (API docs, component props)
- ✅ Epic marked as "contexted" in sprint-status.yaml
