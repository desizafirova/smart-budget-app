# Story 4.2: Smart Category Suggestions

Status: done

## Story

As a user,
I want the app to suggest categories based on my transaction description,
So that I spend less time manually categorizing.

## Acceptance Criteria

**AC 4.2.1: Keyword-based suggestions appear in transaction form**
- **Given** I'm adding a new transaction and typing in the description field
- **When** the description matches known keywords (e.g., "starbucks", "grocery", "uber")
- **Then** the system suggests 1-3 relevant categories as clickable chips below the description field
- **And** suggestions appear within 300ms of typing (95th percentile)
- **And** chips display category icon and name using CategoryChip component
- **And** tapping a suggestion chip auto-selects the category in the form

**AC 4.2.2: Static keyword matching works for common merchants/terms**
- **Given** I type a description containing a known keyword
- **When** the suggestion engine processes the description
- **Then** it matches against the static keyword dictionary:
  - "starbucks", "coffee", "cafe" → "Food & Dining"
  - "uber", "lyft", "taxi", "gas" → "Transport"
  - "amazon", "target", "walmart", "shopping" → "Shopping"
  - "netflix", "spotify", "movie", "concert" → "Entertainment"
  - "rent", "mortgage" → "Rent"
  - "electric", "water", "internet", "utility" → "Utilities"
  - "doctor", "pharmacy", "hospital", "health" → "Health"
  - "school", "course", "tuition", "book" → "Education"
- **And** keyword matching is case-insensitive
- **And** partial matches work (e.g., "starbks" matches "starbucks" with fuzzy matching)

**AC 4.2.3: User learning system tracks category assignments**
- **Given** I assign a transaction with description "starbucks" to "Food & Dining"
- **When** the transaction is saved
- **Then** the system records the assignment in Firestore:
  - Path: `users/{userId}/category-patterns/{normalizedDescription}`
  - Document: `{userId, description: "starbucks", categoryId, count: 1, lastUsed: Date}`
- **And** if the pattern already exists, increment the `count` field
- **And** update the `lastUsed` timestamp
- **And** the operation completes in the background (doesn't block transaction save)

**AC 4.2.4: Learned patterns prioritize user's preferences**
- **Given** I've assigned "starbucks" to "Food & Dining" 3+ times
- **When** I type "starbucks" in a new transaction
- **Then** the suggestion engine prioritizes the learned pattern over static keywords
- **And** "Food & Dining" appears first in the suggestion list
- **And** the suggestion chip shows a subtle indicator that it's learned from my history (optional visual enhancement)

**AC 4.2.5: Suggestions are debounced for performance**
- **Given** I'm typing in the description field
- **When** I type multiple characters quickly
- **Then** the suggestion engine waits 300ms after the last keystroke before running
- **And** this prevents excessive Firebase queries
- **And** the user experience feels responsive (no lag)

**AC 4.2.6: Suggestions work offline**
- **Given** I'm offline and adding a transaction
- **When** I type a description
- **Then** suggestions still appear using:
  - Cached user patterns from previous online session
  - Static keyword dictionary (no network required)
- **And** new pattern assignments queue for sync when back online

## Tasks / Subtasks

- [x] **Task 1: Create static keyword dictionary** (AC: 4.2.2)
  - [x] Create `src/config/keywords-seed.ts` with DEFAULT_KEYWORDS mapping:
    ```typescript
    export const DEFAULT_KEYWORDS: Record<string, string[]> = {
      'food-dining': ['starbucks', 'coffee', 'cafe', 'restaurant', 'mcdonalds', 'burger', 'pizza', 'groceries', 'grocery', 'supermarket', 'food', 'lunch', 'dinner', 'breakfast'],
      'transport': ['uber', 'lyft', 'taxi', 'gas', 'gasoline', 'fuel', 'parking', 'transit', 'metro', 'subway', 'bus', 'train'],
      'shopping': ['amazon', 'target', 'walmart', 'mall', 'store', 'shopping', 'clothes', 'clothing'],
      'entertainment': ['netflix', 'spotify', 'hulu', 'movie', 'cinema', 'theater', 'concert', 'game', 'gaming'],
      'rent': ['rent', 'mortgage', 'housing', 'landlord'],
      'utilities': ['electric', 'electricity', 'water', 'gas', 'internet', 'wifi', 'phone', 'utility', 'bill'],
      'health': ['doctor', 'pharmacy', 'hospital', 'clinic', 'medicine', 'health', 'medical', 'dentist'],
      'education': ['school', 'university', 'college', 'course', 'tuition', 'textbook', 'book', 'education'],
    };
    ```
  - [x] Map keyword slugs to category names (e.g., 'food-dining' → 'Food & Dining')
  - [x] Ensure all 15 default categories have keyword mappings (5 income + 10 expense)
  - [x] Create unit tests for keyword data structure validation

- [x] **Task 2: Implement suggestion engine module** (AC: 4.2.2, 4.2.4)
  - [x] Create `src/utils/suggestions/category-suggestions.ts` with functions:
    ```typescript
    export interface SuggestionResult {
      category: Category;
      source: 'keyword' | 'learned'; // For analytics
      confidence?: number; // Optional for future improvements
    }

    export function matchKeywords(
      description: string,
      keywords: Record<string, string[]>,
      categories: Category[]
    ): SuggestionResult[];

    export function findLearnedPatterns(
      description: string,
      patterns: UserAssignmentPattern[],
      categories: Category[]
    ): SuggestionResult[];

    export function getSuggestedCategories(
      description: string,
      categories: Category[],
      userPatterns: UserAssignmentPattern[]
    ): Category[]; // Returns max 3 suggestions
    ```
  - [x] Implement `matchKeywords()`:
    - Normalize description (lowercase, trim, remove special characters)
    - Check each keyword in DEFAULT_KEYWORDS for substring match
    - Return matching categories (max 3)
    - Implement fuzzy matching using Levenshtein distance (threshold: 2 chars difference)
  - [x] Implement `findLearnedPatterns()`:
    - Filter patterns where `count >= 3` (learned threshold)
    - Sort by count DESC (most frequently used first)
    - Return top 3 categories
  - [x] Implement `getSuggestedCategories()`:
    - Check learned patterns first (prioritize user's history)
    - If learned patterns found (count >= 3), return those
    - Else, fall back to keyword matching
    - Return max 3 suggestions total
  - [x] Create comprehensive unit tests:
    - Test keyword matching with exact matches
    - Test fuzzy matching with typos ("starbks" → "starbucks")
    - Test learned pattern prioritization
    - Test case-insensitive matching
    - Test max 3 suggestions returned
    - Test empty description returns empty array

- [ ] **Task 3: Extend CategoryService with suggestion operations** (AC: 4.2.3, 4.2.4)
  - [ ] Open `src/services/categories.service.ts`
  - [ ] Add to ICategoryService interface:
    ```typescript
    getSuggestedCategories(userId: string, description: string): Promise<Category[]>;
    recordCategoryAssignment(userId: string, description: string, categoryId: string): Promise<void>;
    ```
  - [ ] Implement `getSuggestedCategories()`:
    - Load user patterns from Firestore: `users/{userId}/category-patterns`
    - Query for description (normalized, lowercase)
    - Load all categories from `users/{userId}/categories`
    - Call `getSuggestedCategories()` from suggestion engine
    - Return max 3 Category objects
    - Use Firebase cache for offline support
  - [ ] Implement `recordCategoryAssignment()`:
    - Normalize description (lowercase, trim)
    - Use normalized description as document ID for idempotent updates
    - Check if pattern exists at: `users/{userId}/category-patterns/{normalizedDesc}`
    - If exists: increment `count`, update `lastUsed`
    - If not exists: create with `count: 1`, `lastUsed: now`
    - Run operation in background (don't await in transaction save flow)
  - [ ] Add unit tests:
    - Mock Firestore queries
    - Test getSuggestedCategories returns correct categories
    - Test recordCategoryAssignment increments count
    - Test recordCategoryAssignment creates new pattern
    - Test offline caching works

- [ ] **Task 4: Add UserAssignmentPattern type to category types** (AC: 4.2.3)
  - [ ] Open `src/types/category.ts`
  - [ ] Add interface:
    ```typescript
    export interface UserAssignmentPattern {
      id: string; // Firestore document ID (normalized description)
      userId: string; // Owner
      description: string; // Normalized (lowercase, trimmed): "starbucks"
      categoryId: string; // Reference to Category
      count: number; // Increments each time pattern matches
      lastUsed: Date; // Updated on each assignment
    }
    ```
  - [ ] Export from types barrel file

- [ ] **Task 5: Create CategorySuggestions component** (AC: 4.2.1, 4.2.5)
  - [ ] Create `src/components/categories/CategorySuggestions.tsx`:
    ```typescript
    interface CategorySuggestionsProps {
      description: string; // Current description input value
      onSelect: (category: Category) => void; // Callback when suggestion selected
      userId: string; // For loading user patterns
    }

    export function CategorySuggestions({ description, onSelect, userId }: CategorySuggestionsProps) {
      const [suggestions, setSuggestions] = useState<Category[]>([]);
      const [loading, setLoading] = useState(false);

      // Debounced suggestion loading
      useEffect(() => {
        if (!description || description.length < 3) {
          setSuggestions([]);
          return;
        }

        const timer = setTimeout(async () => {
          setLoading(true);
          const suggested = await categoryService.getSuggestedCategories(userId, description);
          setSuggestions(suggested);
          setLoading(false);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
      }, [description, userId]);

      if (loading) {
        return <div className="text-sm text-gray-500">Loading suggestions...</div>;
      }

      if (suggestions.length === 0) {
        return null; // Don't show anything if no suggestions
      }

      return (
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-sm text-gray-600">Suggestions:</span>
          {suggestions.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category)}
              className="inline-flex items-center"
            >
              <CategoryChip category={category} size="sm" />
            </button>
          ))}
        </div>
      );
    }
    ```
  - [ ] Use CategoryChip component from Story 4.1 for consistent styling
  - [ ] Implement 300ms debounce for performance (AC 4.2.5)
  - [ ] Only show suggestions if description length >= 3 chars (avoid noise)
  - [ ] Handle loading state (optional skeleton or subtle indicator)
  - [ ] Make chips clickable with clear hover/focus states
  - [ ] Ensure mobile touch-friendly (min 44x44px tap targets)

- [ ] **Task 6: Integrate suggestions into TransactionForm** (AC: 4.2.1)
  - [ ] Open `src/components/transactions/TransactionForm.tsx`
  - [ ] Import CategorySuggestions component
  - [ ] Get current user ID from auth store: `const user = useAuthStore(state => state.user)`
  - [ ] Add state for watching description field:
    ```typescript
    const { register, watch, setValue } = useForm<TransactionFormData>();
    const description = watch('description'); // Watch description changes
    ```
  - [ ] Add CategorySuggestions component below description input:
    ```tsx
    <input
      {...register('description', { required: true })}
      placeholder="e.g., Starbucks"
    />
    <CategorySuggestions
      description={description}
      onSelect={(category) => {
        setValue('categoryId', category.id); // Auto-select category
        // Optional: Show visual feedback that category was selected
      }}
      userId={user.uid}
    />
    ```
  - [ ] Ensure suggestion selection updates the category dropdown/selector
  - [ ] Test integration: type "starbucks" → suggestion appears → tap chip → category selected

- [ ] **Task 7: Call recordCategoryAssignment on transaction save** (AC: 4.2.3)
  - [ ] Open `src/components/transactions/TransactionForm.tsx`
  - [ ] In `onSubmit` function, after transaction is saved:
    ```typescript
    const onSubmit = async (data: TransactionFormData) => {
      // 1. Save transaction
      await transactionService.createTransaction(user.uid, data);

      // 2. Record pattern in background (don't await)
      categoryService.recordCategoryAssignment(
        user.uid,
        data.description,
        data.categoryId
      ).catch(err => {
        console.error('Failed to record category pattern:', err);
        // Don't block user flow if pattern recording fails
      });

      // 3. Reset form
      reset();
    };
    ```
  - [ ] Fire-and-forget pattern recording (don't block transaction save)
  - [ ] Handle errors gracefully (log, don't show to user)

- [ ] **Task 8: Update categoryStore with suggestion actions** (AC: 4.2.4)
  - [ ] Open `src/stores/categoryStore.ts`
  - [ ] Add to store interface:
    ```typescript
    interface CategoryStore {
      // Existing state...

      // New suggestion state
      userPatterns: UserAssignmentPattern[];
      loadPatterns: (userId: string) => Promise<void>;
      getSuggestionsForDescription: (description: string) => Category[];
    }
    ```
  - [ ] Implement `loadPatterns()`:
    - Query `users/{userId}/category-patterns`
    - Order by `count` DESC
    - Store in `userPatterns` state
    - Use Firebase `onSnapshot()` for real-time updates (optional)
  - [ ] Implement `getSuggestionsForDescription()`:
    - Call suggestion engine with current categories + patterns
    - Return max 3 suggestions
    - Cache results for 1 minute (optional optimization)
  - [ ] Load patterns when user signs in (AuthProvider trigger)

- [ ] **Task 9: Add Firestore Security Rules for category-patterns** (AC: 4.2.3)
  - [ ] Open `firestore.rules` (or document rules for Epic 7.2)
  - [ ] Add rule for category-patterns collection:
    ```javascript
    match /users/{userId}/category-patterns/{patternId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.data.description is string
        && request.resource.data.description.size() > 0
        && request.resource.data.count is int
        && request.resource.data.count >= 0;
    }
    ```
  - [ ] Test rules using Firebase Emulator (Epic 7.2)

- [ ] **Task 10: TypeScript strict mode compliance** (AC: All)
  - [ ] Run `npm run build` and verify zero TypeScript errors
  - [ ] Ensure all new interfaces are properly typed:
    - UserAssignmentPattern
    - SuggestionResult
    - CategorySuggestionsProps
  - [ ] No `any` types used
  - [ ] Verify Firestore queries have correct types

- [ ] **Task 11: Performance validation - <300ms suggestion latency** (AC: 4.2.5)
  - [ ] Create performance test: `src/utils/suggestions/category-suggestions.perf.test.ts`
  - [ ] Measure `getSuggestedCategories()` execution time:
    ```typescript
    test('suggestion latency <300ms (p95)', async () => {
      const latencies: number[] = [];

      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await getSuggestedCategories('starbucks', categories, patterns);
        const end = performance.now();
        latencies.push(end - start);
      }

      const p95 = calculatePercentile(latencies, 95);
      expect(p95).toBeLessThan(300); // <300ms target
    });
    ```
  - [ ] Verify debounce prevents excessive queries
  - [ ] Test with large pattern datasets (1000+ patterns)
  - [ ] Optimize if necessary (caching, indexing)

- [ ] **Task 12: Unit and component tests** (AC: All)
  - [ ] Unit tests for `category-suggestions.ts`:
    - Test keyword matching with exact matches
    - Test fuzzy matching with typos
    - Test learned pattern prioritization (count >= 3)
    - Test max 3 suggestions
    - Test case-insensitive matching
    - Test empty description returns []
  - [ ] Unit tests for `categoryService.getSuggestedCategories()`:
    - Mock Firestore queries
    - Test returns correct categories
    - Test handles offline mode
  - [ ] Unit tests for `categoryService.recordCategoryAssignment()`:
    - Test creates new pattern
    - Test increments existing pattern count
    - Test updates lastUsed timestamp
  - [ ] Component tests for `CategorySuggestions.tsx`:
    - Test renders suggestion chips
    - Test debounces input (300ms)
    - Test calls onSelect when chip clicked
    - Test hides when no suggestions
    - Test shows loading state

- [ ] **Task 13: Integration testing** (AC: All)
  - [ ] Test full suggestion flow:
    1. User types "starbucks" in TransactionForm
    2. CategorySuggestions component appears with "Food & Dining"
    3. User taps suggestion chip
    4. Category dropdown auto-selects "Food & Dining"
    5. User saves transaction
    6. Pattern recorded in Firestore with count=1
  - [ ] Test learned pattern flow:
    1. Assign "starbucks" to "Food & Dining" 3 times
    2. Verify pattern count=3 in Firestore
    3. Type "starbucks" again
    4. Verify suggestion comes from learned pattern (not keyword)
  - [ ] Test offline mode:
    - Go offline
    - Type "starbucks"
    - Verify suggestions still appear (cached patterns + static keywords)
    - Go online
    - Verify queued patterns sync

- [ ] **Task 14: End-to-end testing** (AC: All)
  - [ ] Playwright test: Keyword suggestions
    - Navigate to transaction form
    - Type "starbucks" in description
    - Wait <300ms
    - Assert "Food & Dining" suggestion appears
    - Click suggestion chip
    - Assert category dropdown updated
    - Save transaction
  - [ ] Playwright test: User learning
    - Add transaction "starbucks" → "Food & Dining" (repeat 3 times)
    - Start new transaction, type "starbucks"
    - Assert suggestion appears (learned pattern)
  - [ ] Playwright test: Offline suggestions
    - Load app, go offline
    - Type "coffee"
    - Assert suggestions appear (cached/keyword)

## Dev Notes

### Learnings from Previous Story

**From Story 4.1: Pre-defined Category System (Status: review)**

- **CategoryService Pattern Established:**
  - `src/services/categories.service.ts` - ICategoryService interface
  - **EXTEND for Story 4.2:** Add `getSuggestedCategories()` and `recordCategoryAssignment()` methods
  - Follow async/try-catch pattern with descriptive errors
  - All Firebase operations go through abstraction layer

- **CategoryStore (Zustand) Structure:**
  - `src/stores/categoryStore.ts` - State, actions, selectors pattern
  - **EXTEND for Story 4.2:**
    - Add `userPatterns: UserAssignmentPattern[]` state
    - Add `loadPatterns(userId: string)` action
    - Add `getSuggestionsForDescription(description: string)` selector
  - Use memoized selectors for performance

- **Category Data Model:**
  - `src/types/category.ts` - Category interface
  - **ADD for Story 4.2:** UserAssignmentPattern interface
  - Firestore collections: `users/{userId}/categories`
  - **NEW collection:** `users/{userId}/category-patterns`

- **CategoryChip Component Available:**
  - `src/components/categories/CategoryChip.tsx` - Reusable badge with icon/color
  - **REUSE in Story 4.2:** Display suggestions as clickable CategoryChip components
  - Already styled with UX spec colors, sizes (sm/md/lg)

- **TransactionForm Integration Point:**
  - `src/components/transactions/TransactionForm.tsx` - Already has category dropdown
  - **EXTEND for Story 4.2:**
    - Add CategorySuggestions component below description input
    - Watch description field changes
    - Call recordCategoryAssignment after transaction save

- **Real-Time Firebase Sync:**
  - Firebase `onSnapshot()` pattern established for categories
  - **OPTIONAL for Story 4.2:** Subscribe to category-patterns for real-time updates
  - Offline persistence enabled (patterns work offline)

- **Bundle Size Status:**
  - Current: 213.84 KB gzipped / 500 KB budget (42.8% used)
  - **Story 4.2 expected impact:** ~8-12 KB (suggestion engine + component)
  - Post-Story 4.2 projection: ~222-226 KB (~44-45% of budget)
  - No additional icon imports needed (reuse CategoryChip icons)

[Source: .bmad-ephemeral/stories/4-1-pre-defined-category-system.md#Dev-Agent-Record]

### Architecture Context

**From Epic Tech Spec (.bmad-ephemeral/stories/tech-spec-epic-4.md):**

**Suggestion Engine Algorithm (Section: Detailed Design - Services and Modules):**

```typescript
// Phase 1: Static keyword matching
const DEFAULT_KEYWORDS: Record<string, string[]> = {
  'food-dining': ['starbucks', 'coffee', 'restaurant', 'groceries', 'food', 'lunch', 'dinner'],
  'transport': ['uber', 'lyft', 'gas', 'parking', 'transit', 'metro', 'taxi'],
  'shopping': ['amazon', 'target', 'walmart', 'mall', 'store'],
  'entertainment': ['netflix', 'spotify', 'movie', 'concert', 'game'],
  // ...more mappings
};

// Phase 2: User learning
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

**CategoryService API Extensions:**

```typescript
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
```

[Source: .bmad-ephemeral/stories/tech-spec-epic-4.md#Detailed-Design]

**Performance Requirements (Section: Non-Functional Requirements):**

**Suggestion Response Time (Critical):**
- **Target:** <300ms from description input to suggestion display (95th percentile)
- **Rationale:** Per PRD FR-3.2, suggestions must appear quickly to avoid interrupting user flow
- **Implementation:**
  - Debounce input to 300ms (prevents excessive queries)
  - Index `category-patterns` collection on `description` field
  - Cache recent patterns in-memory (Zustand store)
  - Keyword matching algorithm: O(1) lookup via hash map
- **Measurement:** Performance monitoring on `getSuggestedCategories()` function calls
- **Acceptance:** 95% of suggestion requests complete in <300ms

[Source: .bmad-ephemeral/stories/tech-spec-epic-4.md#Non-Functional-Requirements]

**Firestore Security Rules:**

```javascript
// Rules for category patterns (Story 4.2)
match /users/{userId}/category-patterns/{patternId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

[Source: .bmad-ephemeral/stories/tech-spec-epic-4.md#APIs-and-Interfaces]

**From Epics (docs/epics.md - Story 4.2):**

**Technical Notes:**
- Implement simple keyword matching: maintain keyword-to-category mapping
- **Phase 1:** Static keywords (e.g., "coffee" → Food & Dining, "gas" → Transport)
- **Phase 2:** User learning - track user's category assignments, build personalized suggestions
- Store learning data in BaaS: {userId, description, category, count}
- Use fuzzy matching for keywords (e.g., "starbks" matches "starbucks")
- Show suggestions as chips below description field
- AI/ML not required for MVP - simple pattern matching is sufficient

[Source: docs/epics.md#Epic-4-Story-4.2]

**From Architecture (docs/architecture.md - ADR-007: React Hook Form):**

**Form Integration:**
```tsx
const { register, watch, setValue } = useForm<TransactionFormData>();
const description = watch('description'); // Watch description changes

// CategorySuggestions component watches description
<CategorySuggestions
  description={description}
  onSelect={(category) => setValue('categoryId', category.id)}
/>
```

### Project Structure Notes

**Expected File Structure After Story 4.2:**

```
src/
├── types/
│   └── category.ts (MODIFIED - add UserAssignmentPattern interface)
├── config/
│   ├── categories-seed.ts (existing from Story 4.1)
│   └── keywords-seed.ts (NEW - DEFAULT_KEYWORDS mapping)
├── utils/
│   └── suggestions/
│       ├── category-suggestions.ts (NEW - suggestion engine)
│       └── category-suggestions.test.ts (NEW - unit tests)
├── services/
│   ├── categories.service.ts (MODIFIED - add getSuggestedCategories, recordCategoryAssignment)
│   └── categories.service.test.ts (MODIFIED - add tests)
├── stores/
│   └── categoryStore.ts (MODIFIED - add userPatterns state, loadPatterns action)
├── components/
│   ├── categories/
│   │   ├── CategoryChip.tsx (existing from Story 4.1 - REUSE)
│   │   ├── CategorySuggestions.tsx (NEW - suggestion chips UI)
│   │   └── CategorySuggestions.test.tsx (NEW - component tests)
│   └── transactions/
│       └── TransactionForm.tsx (MODIFIED - integrate suggestions)
```

**New Files:**
- src/config/keywords-seed.ts (~80 lines - keyword mappings for 8+ categories)
- src/utils/suggestions/category-suggestions.ts (~150 lines - suggestion engine)
- src/utils/suggestions/category-suggestions.test.ts (~200 lines - comprehensive tests)
- src/components/categories/CategorySuggestions.tsx (~80 lines - React component)
- src/components/categories/CategorySuggestions.test.tsx (~100 lines - component tests)

**Modified Files:**
- src/types/category.ts (~10 lines added - UserAssignmentPattern interface)
- src/services/categories.service.ts (~80 lines added - 2 new methods)
- src/services/categories.service.test.ts (~150 lines added - tests for new methods)
- src/stores/categoryStore.ts (~40 lines added - userPatterns state/actions)
- src/components/transactions/TransactionForm.tsx (~30 lines added - CategorySuggestions integration)

**Total Files:** 5 new, 5 modified

**Integration Points:**

- **Story 4.1 Dependency:** CategoryService, CategoryStore, CategoryChip, Category types all reused
- **Firebase Integration:** New collection `users/{userId}/category-patterns` for user learning
- **TransactionForm Integration:** Suggestions appear below description input, auto-select category
- **Epic 5 Forward Dependency:** Dashboard will benefit from better categorization (more accurate charts)
- **ADR-007 (React Hook Form):** `watch()` and `setValue()` for form integration
- **ADR-004 (Zustand):** CategoryStore extended with pattern management

### Testing Standards

**Unit Tests (Vitest):**
- `category-suggestions.ts`:
  - `matchKeywords()`: Test exact matches, case-insensitive, fuzzy matching (Levenshtein), max 3 results
  - `findLearnedPatterns()`: Test filters count >= 3, sorts by count DESC, returns top 3
  - `getSuggestedCategories()`: Test prioritizes learned over keywords, returns max 3
- `categoryService.getSuggestedCategories()`:
  - Mock Firestore queries for patterns
  - Test returns correct categories
  - Test falls back to keywords if no learned patterns
  - Test offline caching works
- `categoryService.recordCategoryAssignment()`:
  - Test creates new pattern with count=1
  - Test increments existing pattern count
  - Test updates lastUsed timestamp
  - Test handles concurrent writes (idempotent)

**Component Tests (@testing-library/react):**
- `CategorySuggestions.tsx`:
  - Test renders suggestion chips when suggestions available
  - Test hides when description empty or no suggestions
  - Test debounces input (300ms)
  - Test calls onSelect when chip clicked
  - Test shows loading state (optional)
  - Test mobile touch-friendly (tap targets >= 44x44px)

**Integration Tests (Vitest + Firebase Emulator):**
- Full suggestion flow:
  1. Type "starbucks" → getSuggestedCategories called → "Food & Dining" returned
  2. Select suggestion → setValue called → category dropdown updated
  3. Save transaction → recordCategoryAssignment called → pattern created
- Learned pattern flow:
  1. Assign "starbucks" 3 times → pattern count=3 in Firestore
  2. Type "starbucks" → suggestion from learned pattern (not keyword)
- Offline mode:
  - Go offline → Type "coffee" → Suggestions appear (cached patterns + keywords)

**Performance Tests (Vitest):**
- Suggestion latency:
  - Run `getSuggestedCategories()` 100 times
  - Measure p50, p95, p99 latencies
  - Assert p95 <300ms (critical requirement)
- Debounce validation:
  - Simulate rapid typing
  - Assert only 1 query fires after 300ms delay
- Large dataset:
  - Test with 1000+ patterns
  - Assert latency still <300ms

**End-to-End Tests (Playwright - Epic 7.6):**
- Keyword suggestions:
  - Navigate to transaction form
  - Type "starbucks"
  - Wait <300ms
  - Assert "Food & Dining" suggestion visible
  - Click suggestion chip
  - Assert category dropdown updated
- User learning:
  - Add transaction "starbucks" → "Food & Dining" 3 times
  - Start new transaction
  - Type "starbucks"
  - Assert suggestion appears (learned pattern)
- Offline suggestions:
  - Load app online
  - Go offline
  - Type "coffee"
  - Assert suggestions appear (cached/keyword)

**Manual Testing Checklist:**
- [ ] Type "starbucks" in transaction form → "Food & Dining" suggestion appears <300ms
- [ ] Type "uber" → "Transport" suggestion appears
- [ ] Type "netflix" → "Entertainment" suggestion appears
- [ ] Test fuzzy matching: type "starbks" (typo) → "Food & Dining" still appears
- [ ] Tap suggestion chip → Category dropdown auto-selects
- [ ] Save transaction → Verify pattern recorded in Firestore (DevTools)
- [ ] Repeat "starbucks" assignment 3 times → Verify pattern count=3
- [ ] Type "starbucks" again → Verify suggestion from learned pattern
- [ ] Test debounce: Type rapidly → Only 1 query fires after 300ms pause
- [ ] Test mobile: Suggestions appear on mobile, chips are touch-friendly
- [ ] Test offline: Go offline, type "coffee" → Suggestions still appear
- [ ] Test performance: Measure suggestion latency with browser DevTools Performance tab

### References

- [Epic Tech Spec: .bmad-ephemeral/stories/tech-spec-epic-4.md - Section: Detailed Design, Services and Modules, APIs and Interfaces, Non-Functional Requirements]
- [Epic Breakdown: docs/epics.md#Epic-4 - Story 4.2]
- [Architecture: docs/architecture.md - ADR-007 (React Hook Form), ADR-004 (Zustand), ADR-001 (Firebase)]
- [Previous Story: .bmad-ephemeral/stories/4-1-pre-defined-category-system.md - CategoryService, CategoryStore, CategoryChip patterns]
- [Story 3.1: TransactionForm structure and integration patterns]
- [Firebase Firestore Queries: https://firebase.google.com/docs/firestore/query-data/queries]
- [React Hook Form watch/setValue: https://react-hook-form.com/docs/useform/watch]
- [Levenshtein Distance Algorithm: https://en.wikipedia.org/wiki/Levenshtein_distance]

## Dev Agent Record

### Completion Notes
**Completed:** 2025-11-17
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

### Context Reference

- `.bmad-ephemeral/stories/4-2-smart-category-suggestions.context.xml` (Generated: 2025-11-17)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
