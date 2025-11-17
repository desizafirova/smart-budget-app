# Story 4.1: Pre-defined Category System

Status: ready-for-dev

## Story

As a user,
I want a set of common categories available from the start,
so that I can immediately organize my transactions without setup work.

## Acceptance Criteria

**AC 4.1.1: Default categories seeded on first sign-in**
- **Given** I'm a new user signing in for the first time (anonymous or claimed account)
- **When** authentication completes and my user document is created in Firestore
- **Then** 15 pre-defined categories are automatically seeded in my account:
  - **Income (5):** Salary, Freelance, Investment, Gift, Other Income
  - **Expense (10):** Food & Dining, Transport, Shopping, Entertainment, Rent, Utilities, Health, Education, Other Expense
- **And** each category has: `name`, `type` (income/expense), `icon` (Lucide icon name), `color` (hex code), `isDefault: true`
- **And** categories are stored in Firestore: `users/{userId}/categories` subcollection
- **And** seeding is idempotent (check if categories exist before seeding to avoid duplicates)

**AC 4.1.2: Categories available in transaction form**
- **Given** I have default categories seeded in my account
- **When** I open the transaction form to add a new transaction
- **Then** I can select a category from a dropdown showing all 15 pre-defined categories
- **And** each category displays its icon and name in the dropdown
- **And** categories are grouped by type: Income categories first, then Expense categories
- **And** the dropdown is searchable/filterable for quick selection

**AC 4.1.3: Category colors match UX specification**
- **Given** I'm viewing transactions or categories anywhere in the app
- **When** a category is displayed (badge, chip, chart legend, dropdown)
- **Then** the category uses its assigned color from the UX design specification:
  - Food & Dining: #f59e0b (Amber)
  - Transport: #3b82f6 (Blue)
  - Shopping: #8b5cf6 (Purple)
  - Entertainment: #ec4899 (Pink)
  - Health: #10b981 (Green)
  - Education: #6366f1 (Indigo)
  - Rent: #ef4444 (Red)
  - Utilities: #f97316 (Orange)
  - Income categories: #10b981 (Green)
  - Other/Uncategorized: #6b7280 (Gray)
- **And** colors pass WCAG AA contrast requirements (4.5:1 ratio on white background)
- **And** color consistency is maintained across all UI elements (charts, badges, transaction list)

**AC 4.1.4: Category icons display correctly**
- **Given** I'm viewing categories in the app
- **When** a category is displayed (dropdown, badge, transaction list)
- **Then** the category shows its assigned Lucide icon:
  - Salary: DollarSign
  - Freelance: Briefcase
  - Investment: TrendingUp
  - Gift: Gift
  - Other Income: Plus
  - Food & Dining: Utensils
  - Transport: Car
  - Shopping: ShoppingBag
  - Entertainment: Film
  - Rent: Home
  - Utilities: Zap
  - Health: Heart
  - Education: BookOpen
  - Other Expense: Tag
- **And** icons are rendered at consistent size (w-5 h-5 or 20px)
- **And** icons use the category's color for visual distinction

**AC 4.1.5: Real-time category sync**
- **Given** I have categories seeded in my account
- **When** categories are loaded from Firestore
- **Then** the app uses real-time `onSnapshot()` listener to subscribe to category changes
- **And** category updates propagate to the UI within 3 seconds (per PRD)
- **And** categories work offline using Firebase offline persistence

## Tasks / Subtasks

- [ ] **Task 1: Create Category data model and seed config** (AC: 4.1.1, 4.1.3, 4.1.4)
  - [ ] Create `src/types/category.ts` with Category interface:
    ```typescript
    export interface Category {
      id: string;
      userId: string;
      name: string;
      type: 'income' | 'expense';
      icon: string; // Lucide icon name
      color: string; // Hex color
      isDefault: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
    export type NewCategory = Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
    ```
  - [ ] Create `src/config/categories-seed.ts` with DEFAULT_CATEGORIES array:
    - 5 income categories with exact colors/icons from tech spec
    - 10 expense categories with exact colors/icons from UX spec
    - Export as `export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]`

- [ ] **Task 2: Create CategoryService with seeding logic** (AC: 4.1.1, 4.1.5)
  - [ ] Create `src/services/categories.service.ts` with ICategoryService interface:
    ```typescript
    export interface ICategoryService {
      seedDefaultCategories(userId: string): Promise<void>;
      getCategories(userId: string): Promise<Category[]>;
      createCategory(userId: string, category: NewCategory): Promise<Category>;
      updateCategory(userId: string, categoryId: string, updates: Partial<Category>): Promise<void>;
      deleteCategory(userId: string, categoryId: string): Promise<void>;
    }
    ```
  - [ ] Implement `seedDefaultCategories()`:
    - Check if `users/{userId}/categories` subcollection is empty
    - If empty, batch write all DEFAULT_CATEGORIES with user's ID
    - Use Firestore `writeBatch()` for atomic seeding (all or nothing)
    - Add timestamps (createdAt, updatedAt) to each category
    - Return Promise<void> when complete
  - [ ] Implement `getCategories()`:
    - Query `users/{userId}/categories` collection
    - Order by name ascending
    - Return Promise<Category[]>
  - [ ] Use Firebase abstraction layer (IDatabaseService) for all operations

- [ ] **Task 3: Trigger category seeding on first user sign-in** (AC: 4.1.1)
  - [ ] Open `src/features/auth/AuthCallback.tsx` or equivalent auth initialization file
  - [ ] After successful authentication (anonymous or claimed), check if user is new:
    - Call `seedDefaultCategories(user.uid)`
    - Only seed if categories subcollection is empty (idempotent check)
  - [ ] Add error handling for seeding failures (log error, continue app flow)
  - [ ] Consider triggering seeding in `useEffect()` after auth state initialized

- [ ] **Task 4: Create categoryStore with Zustand** (AC: 4.1.2, 4.1.5)
  - [ ] Create `src/stores/categoryStore.ts` with Zustand store:
    ```typescript
    interface CategoryStore {
      categories: Category[];
      loading: boolean;
      error: string | null;

      // Actions
      loadCategories: (userId: string) => Promise<void>;
      subscribeToCategories: (userId: string) => () => void; // Returns unsubscribe function

      // Selectors (memoized)
      getCategoryById: (id: string) => Category | undefined;
      getIncomeCategories: () => Category[];
      getExpenseCategories: () => Category[];
    }
    ```
  - [ ] Implement `subscribeToCategories()`:
    - Use Firestore `onSnapshot()` for real-time updates
    - Update `categories` array on each snapshot
    - Set `loading: false` after initial load
    - Return unsubscribe function for cleanup
  - [ ] Implement selectors with memoization (use Zustand's built-in selectors)
  - [ ] Follow Zustand patterns from transactionStore (Story 3.1-3.4)

- [ ] **Task 5: Create CategoryChip component** (AC: 4.1.3, 4.1.4)
  - [ ] Create `src/components/categories/CategoryChip.tsx`:
    - Props: `category: Category`, `size?: 'sm' | 'md' | 'lg'`
    - Display category icon (from Lucide) with category color
    - Display category name
    - Use Tailwind for styling: badge with rounded corners, padding
    - Background: light version of category color (opacity 10-20%)
    - Text: category color at full saturation
    - Icon size: w-4 h-4 (sm), w-5 h-5 (md), w-6 h-6 (lg)
  - [ ] Example structure:
    ```tsx
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full">
      <Icon className="w-4 h-4" style={{ color: category.color }} />
      <span className="text-sm font-medium" style={{ color: category.color }}>
        {category.name}
      </span>
    </span>
    ```

- [ ] **Task 6: Add category dropdown to TransactionForm** (AC: 4.1.2)
  - [ ] Open `src/components/transactions/TransactionForm.tsx`
  - [ ] Add category field using React Hook Form:
    ```tsx
    <select {...register('categoryId', { required: 'Category is required' })}>
      <optgroup label="Income">
        {incomeCategories.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.icon} {cat.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Expense">
        {expenseCategories.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.icon} {cat.name}
          </option>
        ))}
      </optgroup>
    </select>
    ```
  - [ ] Load categories from categoryStore using Zustand selectors
  - [ ] Show loading skeleton while categories load
  - [ ] Default to first expense category if no category selected
  - [ ] Add validation: category is required

- [ ] **Task 7: Display categories in TransactionList** (AC: 4.1.3, 4.1.4)
  - [ ] Open `src/components/transactions/TransactionItem.tsx`
  - [ ] Add CategoryChip component to display transaction's category
  - [ ] Load category by ID from categoryStore
  - [ ] If category not found, show "Uncategorized" with gray color
  - [ ] Position category badge below description or next to amount

- [ ] **Task 8: Initialize category subscription on app load** (AC: 4.1.5)
  - [ ] Open `src/App.tsx` or main layout component
  - [ ] Add `useEffect()` to subscribe to categories when user is authenticated:
    ```tsx
    useEffect(() => {
      if (user) {
        const unsubscribe = categoryStore.subscribeToCategories(user.uid);
        return () => unsubscribe(); // Cleanup on unmount
      }
    }, [user]);
    ```
  - [ ] Ensure subscription starts after auth state is initialized
  - [ ] Handle cleanup when user signs out (unsubscribe)

- [ ] **Task 9: TypeScript strict mode compliance** (AC: All)
  - [ ] Run `npm run build` and verify zero TypeScript errors
  - [ ] Ensure all new types are properly defined (Category, NewCategory, ICategoryService)
  - [ ] No `any` types used
  - [ ] Verify Lucide icon imports have correct types

- [ ] **Task 10: Color contrast validation** (AC: 4.1.3)
  - [ ] Verify all category colors pass WCAG AA contrast (4.5:1 on white)
  - [ ] Use online contrast checker or browser DevTools
  - [ ] Adjust colors if needed (currently all colors from UX spec)
  - [ ] Document any color adjustments in completion notes

- [ ] **Task 11: Bundle size validation** (AC: All)
  - [ ] Run `npm run build` and check dist/ output
  - [ ] Estimate Story 4.1 impact: ~10-15 KB (new store, service, components, 15 Lucide icons)
  - [ ] 15 Lucide icons × ~0.5 KB = ~7.5 KB
  - [ ] Verify total bundle size still <500KB gzipped
  - [ ] Current: 212.47 KB, post-4.1 target: ~225-230 KB (~45% of budget)
  - [ ] Document bundle size in completion notes

- [ ] **Task 12: End-to-end testing** (AC: All)
  - [ ] Sign out and delete local storage/IndexedDB
  - [ ] Sign in as new anonymous user
  - [ ] Verify 15 default categories seeded automatically
  - [ ] Open transaction form
  - [ ] Verify category dropdown shows all 15 categories grouped by type
  - [ ] Verify each category shows correct icon
  - [ ] Add transaction with "Food & Dining" category
  - [ ] Verify transaction list shows category badge with correct color (amber #f59e0b)
  - [ ] Verify category icon displays (Utensils)
  - [ ] Test all categories (add transaction for each, verify icon/color)
  - [ ] Verify real-time sync: Open app on 2 devices, verify categories appear on both
  - [ ] Test offline: Go offline, verify categories still accessible (cached)

## Dev Notes

### Learnings from Previous Story

**From Story 3.4: Delete Transaction (Status: review)**

- **Database Service Pattern:**
  - `src/services/database.ts` - IDatabaseService interface is the abstraction layer
  - `src/services/firebase/firebaseDatabase.ts` - Firebase implementation
  - **REUSE for Story 4.1:** Follow same pattern for category operations
  - Pattern: Async operations with try/catch, descriptive error messages
  - All Firebase operations go through abstraction layer for future migration flexibility

- **Zustand Store Structure:**
  - `src/stores/transactionStore.ts` established patterns: state, actions, selectors
  - **REPLICATE for Story 4.1:**
    - Create `categoryStore.ts` with same structure
    - State: categories array, loading, error
    - Actions: loadCategories, subscribeToCategories
    - Selectors: getCategoryById, getIncomeCategories, getExpenseCategories
  - Use Zustand's built-in selectors for memoization

- **Real-Time Subscription Pattern (from Story 3.2):**
  - Firestore `onSnapshot()` for real-time updates
  - **CRITICAL for Story 4.1:** Categories must use real-time subscription (AC 4.1.5)
  - Pattern:
    ```typescript
    const unsubscribe = onSnapshot(
      collection(db, `users/${userId}/categories`),
      (snapshot) => {
        const categories = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Category));
        set({ categories, loading: false });
      }
    );
    return unsubscribe; // For cleanup
    ```
  - Subscription lifecycle: start on auth, cleanup on unmount/sign-out

- **Firestore Collection Structure:**
  - Pattern: `users/{userId}/subcollection`
  - **Story 4.1 follows:** `users/{userId}/categories`
  - Subcollections isolate user data, enforce security rules per user
  - Documents have auto-generated IDs (use Firestore `addDoc()`)

- **Format Utilities Available:**
  - `src/utils/formatCurrency.ts`, `src/utils/formatDate.ts`
  - **Story 4.1 note:** No formatting needed for categories (just name/icon/color)
  - Future stories (4.2-4.4) may need category lookup utilities

- **Component Patterns:**
  - TransactionForm modal structure (Story 3.1)
  - TransactionItem component structure (Story 3.2)
  - **Story 4.1 creates:** CategoryChip component (reusable badge)
  - Pattern: Accept props, use Tailwind for styling, export as default

- **Bundle Size Status:**
  - Current: 212.47 KB gzipped / 500 KB budget (42.5% used)
  - **Story 4.1 expected impact:** ~10-15 KB (new store, service, components, 15 Lucide icons)
  - Post-Story 4.1 projection: ~225-230 KB (~45% of budget)
  - 15 Lucide icons × ~0.5 KB each = ~7.5 KB (tree-shakable imports)

- **Icon Library (Lucide React - ADR-009):**
  - Already installed and used in Stories 3.1-3.4
  - **Story 4.1 adds:** 14 new icon imports (DollarSign, Briefcase, TrendingUp, Gift, Plus, Utensils, Car, ShoppingBag, Film, Home, Zap, Heart, BookOpen, Tag)
  - Import pattern:
    ```typescript
    import { Utensils, Car, ShoppingBag } from 'lucide-react';
    ```
  - Tree-shakable: only used icons are bundled

[Source: .bmad-ephemeral/stories/3-4-delete-transaction.md#Dev-Agent-Record]

### Architecture Context

**From Epic Tech Spec (.bmad-ephemeral/stories/tech-spec-epic-4.md):**

**Category Data Model (Section: Data Models and Contracts):**
```typescript
// Firestore path: users/{userId}/categories/{categoryId}
interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  icon: string; // Lucide icon name
  color: string; // Hex color
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Default Categories Seed Data:**
- 5 Income: Salary, Freelance, Investment, Gift, Other Income (all green #10b981)
- 10 Expense: Food & Dining (#f59e0b), Transport (#3b82f6), Shopping (#8b5cf6), Entertainment (#ec4899), Rent (#ef4444), Utilities (#f97316), Health (#10b981), Education (#6366f1), Other Expense (#6b7280)

**seedDefaultCategories() Implementation:**
- Check if categories subcollection is empty
- Batch write all DEFAULT_CATEGORIES
- Atomic operation (all or nothing)
- Idempotent (safe to call multiple times)

**Category Service Interface (Section: Services and Modules):**
```typescript
interface ICategoryService {
  seedDefaultCategories(userId: string): Promise<void>;
  getCategories(userId: string): Promise<Category[]>;
  createCategory(userId: string, category: NewCategory): Promise<Category>;
  updateCategory(userId: string, categoryId: string, updates: Partial<Category>): Promise<void>;
  deleteCategory(userId: string, categoryId: string): Promise<void>;
  getSuggestedCategories(userId: string, description: string): Promise<Category[]>; // Story 4.2
  recordCategoryAssignment(userId: string, description: string, categoryId: string): Promise<void>; // Story 4.2
}
```

**Real-Time Sync (Section: APIs and Interfaces):**
```typescript
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

**Firebase Security Rules (Epic 7.2 reference):**
```javascript
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
```

[Source: .bmad-ephemeral/stories/tech-spec-epic-4.md]

**From Epics (docs/epics.md - Story 4.1):**

**Technical Notes:**
- Seed default categories on first user sign-in (anonymous or claimed)
- BaaS schema: {userId, categoryId, name, type, icon, color: string (hex), isDefault: true}
- Icons: Use Lucide React icon library for visual distinction
- Colors: Use exact hex codes from UX spec for consistency across charts, cards, and UI
- Category dropdown in transaction form pulls from this list
- Color consistency critical for user recognition (same category = same color everywhere)

[Source: docs/epics.md#Epic-4-Story-4.1]

**From Architecture (docs/architecture.md - ADR-001: Firebase):**

**Firestore Batch Write Pattern:**
```typescript
import { writeBatch, doc, collection } from 'firebase/firestore';

const batch = writeBatch(db);
DEFAULT_CATEGORIES.forEach(category => {
  const docRef = doc(collection(db, `users/${userId}/categories`));
  batch.set(docRef, {
    ...category,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});
await batch.commit();
```

**From Architecture (docs/architecture.md - ADR-009: Lucide React Icons):**

**Category Icon Imports:**
```typescript
import {
  DollarSign, Briefcase, TrendingUp, Gift, Plus,
  Utensils, Car, ShoppingBag, Film, Home,
  Zap, Heart, BookOpen, Tag
} from 'lucide-react';
```

**Icon Usage:**
```tsx
const Icon = iconMap[category.icon]; // e.g., Utensils for Food & Dining
<Icon className="w-5 h-5" style={{ color: category.color }} />
```

**From UX Design Specification (docs/ux-design-specification.md):**

**Category Color Palette (Section 3.1):**
- Food & Dining: #f59e0b (Amber)
- Transportation: #3b82f6 (Blue)
- Shopping: #8b5cf6 (Purple)
- Entertainment: #ec4899 (Pink)
- Health: #10b981 (Green)
- Education: #6366f1 (Indigo)
- Rent/Housing: #ef4444 (Red)
- Utilities: #f97316 (Orange)
- Income categories: #10b981 (Green)
- Other/Uncategorized: #6b7280 (Gray)

**CategoryChip Component (Section 6.2):**
- Badge with rounded corners (rounded-full)
- Light background (category color at 10-20% opacity)
- Icon and text in full category color
- Padding: px-2.5 py-1
- Gap between icon and text: gap-1.5

### Project Structure Notes

**Expected File Structure After Story 4.1:**

```
src/
├── types/
│   └── category.ts (NEW - Category interface)
├── config/
│   └── categories-seed.ts (NEW - DEFAULT_CATEGORIES array)
├── services/
│   └── categories.service.ts (NEW - CategoryService implementation)
├── stores/
│   └── categoryStore.ts (NEW - Zustand store for categories)
├── components/
│   ├── categories/
│   │   └── CategoryChip.tsx (NEW - reusable category badge)
│   └── transactions/
│       ├── TransactionForm.tsx (MODIFY - add category dropdown)
│       └── TransactionItem.tsx (MODIFY - display CategoryChip)
├── features/
│   ├── auth/
│   │   └── AuthCallback.tsx (MODIFY - trigger seedDefaultCategories on first sign-in)
│   └── transactions/
│       └── Transactions.tsx (MODIFY - initialize category subscription)
└── App.tsx (MODIFY - initialize category subscription on auth)
```

**New Files:**
- src/types/category.ts (~15 lines)
- src/config/categories-seed.ts (~60 lines - 15 categories × 4 lines each)
- src/services/categories.service.ts (~150 lines - interface + implementation)
- src/stores/categoryStore.ts (~100 lines - Zustand store)
- src/components/categories/CategoryChip.tsx (~40 lines - reusable component)

**Modified Files:**
- src/components/transactions/TransactionForm.tsx (~30 lines added - category dropdown)
- src/components/transactions/TransactionItem.tsx (~10 lines added - CategoryChip display)
- src/features/auth/AuthCallback.tsx (~15 lines added - seeding trigger)
- src/features/transactions/Transactions.tsx (~10 lines added - subscription init)
- src/App.tsx (~15 lines added - subscription init alternative)

**Total Files:** 5 new, 5 modified

**Integration Points:**

- **Epic 2 Dependency:** Authenticated user UID from `useAuthStore().user.uid`
- **Epic 3 Integration:** TransactionForm extended with category dropdown, TransactionItem displays category
- **Epic 5 Forward Dependency:** Dashboard charts will use category colors for visualization
- **ADR-001 (Firebase):** Category storage in Firestore, real-time sync via onSnapshot
- **ADR-004 (Zustand):** CategoryStore follows same patterns as transactionStore
- **ADR-009 (Lucide Icons):** 14 new icon imports for category visual distinction

### Testing Standards

**Unit Tests (Vitest):**
- `seedDefaultCategories()`: Mock Firestore, verify batch write with 15 categories
- `seedDefaultCategories()`: Verify idempotent (check if categories exist before seeding)
- `getCategories()`: Mock Firestore query, verify categories returned
- `categoryStore.loadCategories()`: Verify categories loaded from service
- `categoryStore.subscribeToCategories()`: Verify onSnapshot subscription created
- `categoryStore.getCategoryById()`: Verify selector returns correct category
- `categoryStore.getIncomeCategories()`: Verify selector filters by type='income'
- `CategoryChip`: Render with category data, verify icon and name displayed
- `CategoryChip`: Verify color applied to icon and text

**Component Tests (@testing-library/react):**
- `CategoryChip`: Render with category, verify correct Lucide icon rendered
- `CategoryChip`: Verify color style applied correctly
- `TransactionForm`: Verify category dropdown shows all categories grouped by type
- `TransactionForm`: Verify category validation (required field)
- `TransactionItem`: Verify CategoryChip displayed with transaction's category

**Integration Tests (Vitest + Firebase Emulator):**
- Full seeding flow: Create new user → Call seedDefaultCategories → Verify 15 categories in Firestore
- Real-time sync: Seed categories → Subscribe → Verify categories appear in store
- Idempotent seeding: Call seedDefaultCategories twice → Verify only 15 categories (no duplicates)

**End-to-End Tests (Playwright - Epic 7.6):**
- New user sign-in → Verify 15 default categories seeded
- Add transaction → Verify category dropdown shows all categories
- Add transaction with category → Verify CategoryChip displayed with correct icon/color
- Real-time sync: Seed categories on device 1 → Verify categories appear on device 2
- Offline: Go offline → Verify categories still accessible (Firebase persistence)

**Manual Testing Checklist:**
- [ ] Sign out and clear local storage/IndexedDB
- [ ] Sign in as new anonymous user
- [ ] Open browser DevTools → Firestore tab (if available) → Verify 15 categories seeded
- [ ] Open transaction form
- [ ] Verify category dropdown shows all 15 categories
- [ ] Verify categories grouped: Income first, Expense second
- [ ] Verify each category shows its icon
- [ ] Add transaction with "Food & Dining" category
- [ ] Verify transaction list shows CategoryChip with amber color (#f59e0b)
- [ ] Verify Utensils icon displayed
- [ ] Test all 15 categories (add transaction for each, verify icon/color)
- [ ] Test color contrast (WCAG AA): Verify all colors readable on white
- [ ] Test real-time sync: Open app on 2 devices, verify categories appear on both
- [ ] Test offline: Go offline, verify categories still accessible

### References

- [Epic Tech Spec: .bmad-ephemeral/stories/tech-spec-epic-4.md - Section: Data Models, Services and Modules, APIs and Interfaces]
- [Epic Breakdown: docs/epics.md#Epic-4 - Story 4.1]
- [UX Design Spec: docs/ux-design-specification.md - Section 3.1 (Color System), Section 6.2 (CategoryChip)]
- [Architecture: docs/architecture.md - ADR-001 (Firebase Firestore), ADR-009 (Lucide React Icons)]
- [Previous Story: .bmad-ephemeral/stories/3-4-delete-transaction.md - Database service patterns, Zustand patterns]
- [Story 3.1: .bmad-ephemeral/stories/3-1-add-transaction.md - TransactionForm structure]
- [Story 3.2: .bmad-ephemeral/stories/3-2-view-transaction-list.md - Real-time subscription pattern]
- [Firebase Batch Writes: https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes]
- [Lucide React Icons: https://lucide.dev/icons/]

## Dev Agent Record

### Context Reference

- `.bmad-ephemeral/stories/4-1-pre-defined-category-system.context.xml`

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

<!-- Will be filled by dev agent -->

### Completion Notes List

<!-- Will be filled by dev agent after implementation -->

### File List

<!-- Will be filled by dev agent after implementation -->
