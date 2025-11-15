# Story 1.3: Basic Routing & Layout Structure

Status: ready-for-dev

## Story

As a developer,
I want to set up client-side routing and a basic layout structure,
So that the application can navigate between pages and has consistent UI structure.

## Acceptance Criteria

1. React Router v7 configured with `createBrowserRouter()` and `RouterProvider`

2. Three routes defined:
   - `/` - Dashboard placeholder (will be built in Epic 5)
   - `/transactions` - Transaction list placeholder (will be built in Epic 3)
   - `/categories` - Category management placeholder (will be built in Epic 4)

3. Layout component created at `src/components/layout/Layout.tsx` with:
   - Header section with navigation placeholders
   - Main content area using `<Outlet />` for route rendering
   - Footer section with placeholder content

4. Mobile-responsive layout:
   - Works on 320px minimum width (mobile)
   - Scales up to 2560px (desktop)
   - Uses Tailwind mobile-first utilities

5. Client-side navigation works:
   - Clicking navigation links changes route without page refresh
   - URL updates in browser address bar
   - Browser back/forward buttons work correctly

6. Accessible layout structure:
   - Uses semantic HTML: `<nav>`, `<main>`, `<footer>`
   - ARIA landmarks applied: `role="navigation"`, `role="main"`, `role="contentinfo"`
   - Keyboard navigation functional (Tab key traversal)

7. Route-based code splitting:
   - Route components lazy-loaded using `React.lazy()`
   - Loading fallback component shown during route transitions

8. TypeScript compilation successful with no errors

9. Development server runs without console errors

10. Production build succeeds with bundle size <140KB gzipped

## Tasks / Subtasks

- [ ] **Task 1: Create folder structure for layout and features** (AC: #3, #7)
  - [ ] Create `src/components/layout/` directory
  - [ ] Create `src/features/dashboard/` directory
  - [ ] Create `src/features/transactions/` directory
  - [ ] Create `src/features/categories/` directory
  - [ ] Verify folder structure matches tech spec

- [ ] **Task 2: Configure React Router v7** (AC: #1, #2)
  - [ ] Import `createBrowserRouter` and `RouterProvider` from `react-router`
  - [ ] Create router configuration in `src/App.tsx`
  - [ ] Define route structure with path `/`, `/transactions`, `/categories`
  - [ ] Configure Layout as parent route with nested children
  - [ ] Test: Navigate to each route manually in browser, verify URL changes

- [ ] **Task 3: Create Layout component with semantic HTML** (AC: #3, #6)
  - [ ] Create `src/components/layout/Layout.tsx` file
  - [ ] Implement `<header>` with `<nav role="navigation">` and placeholder nav links
  - [ ] Implement `<main role="main">` with `<Outlet />` for child routes
  - [ ] Implement `<footer role="contentinfo">` with placeholder text
  - [ ] Add TypeScript interface for Layout props (if needed)
  - [ ] Test: Verify semantic HTML structure with browser DevTools

- [ ] **Task 4: Style Layout with Tailwind CSS (mobile-first)** (AC: #4, #7)
  - [ ] Apply mobile-first Tailwind classes to Layout structure
  - [ ] Header: `flex items-center justify-between p-4 bg-white shadow-sm`
  - [ ] Navigation: `flex gap-4` with responsive adjustments (`md:gap-6`)
  - [ ] Main content: `flex-1 container mx-auto p-4 max-w-7xl`
  - [ ] Footer: `p-4 text-center text-sm text-gray-600 border-t`
  - [ ] Test: Resize browser to 320px, 768px, 1024px, 2560px - verify responsive behavior

- [ ] **Task 5: Create placeholder page components** (AC: #2, #7)
  - [ ] Create `src/features/dashboard/Dashboard.tsx` placeholder
  - [ ] Create `src/features/transactions/Transactions.tsx` placeholder
  - [ ] Create `src/features/categories/Categories.tsx` placeholder
  - [ ] Add basic content: heading + "Coming in Epic X" message
  - [ ] Apply Tailwind styling: `flex flex-col items-center justify-center min-h-screen`
  - [ ] Test: Navigate to each route, verify placeholder renders

- [ ] **Task 6: Implement route-based code splitting** (AC: #7)
  - [ ] Wrap route components with `React.lazy()` imports
  - [ ] Add `<Suspense fallback={<LoadingSpinner />}>` wrapper in router config
  - [ ] Create simple LoadingSpinner component or use "Loading..." text
  - [ ] Test: Check Network tab in DevTools, verify separate chunks for each route

- [ ] **Task 7: Implement navigation links in Header** (AC: #5, #6)
  - [ ] Use `<Link>` component from `react-router` for navigation
  - [ ] Create links: "Dashboard" → `/`, "Transactions" → `/transactions`, "Categories" → `/categories`
  - [ ] Add active route highlighting using `useLocation()` hook
  - [ ] Ensure keyboard navigation works (Tab to links, Enter to activate)
  - [ ] Test: Click links, verify URL changes without page refresh
  - [ ] Test: Use browser back/forward buttons, verify routing works

- [ ] **Task 8: Verify TypeScript compilation and build** (AC: #8, #9, #10)
  - [ ] Run `npm run dev` - verify no TypeScript errors in console
  - [ ] Run `npm run build` - verify production build succeeds
  - [ ] Check bundle size in `dist/` - should be <140KB gzipped
  - [ ] Test: Visit `http://localhost:5173` (or dev server URL), verify app loads

- [ ] **Task 9: Accessibility verification** (AC: #6)
  - [ ] Test keyboard navigation: Tab through all interactive elements
  - [ ] Verify focus indicators visible on nav links
  - [ ] Use browser DevTools accessibility panel to check ARIA landmarks
  - [ ] Test with keyboard only: navigate between routes using Tab + Enter
  - [ ] Verify semantic HTML structure: `<nav>`, `<main>`, `<footer>` present

## Dev Notes

### Learnings from Previous Story

**From Story 1-2-backend-as-a-service-integration (Status: review)**

- **Folder Structure Ready**: `src/services/` directory exists with Firebase integration complete
- **Path Aliases Configured**: Use `@/components`, `@/services`, `@/stores` for cleaner imports
- **TypeScript Strict Mode**: Use `import type` syntax for type-only imports to comply with `verbatimModuleSyntax`
- **Firebase Initialized**: Firebase SDK initialized in `src/main.tsx` - do not duplicate initialization
- **Testing Infrastructure**: Vitest configured with jsdom environment - follow co-located test pattern
- **Production Build Success**: Current bundle size 121.50 KB gzipped (well under 500KB target)

**Services Available for Future Use:**
- `IAuthService` interface at `src/services/auth.ts` - will be used in Epic 2
- `IDatabaseService` interface at `src/services/database.ts` - will be used in Epic 3
- Firebase instances exported from `src/services/firebase/firebaseConfig.ts`

[Source: stories/1-2-backend-as-a-service-integration.md#Dev-Agent-Record]

### Architecture Context

**From ADR 4 (React Router v7):**
- React Router v7 chosen for 15% smaller bundle size vs v6 (~9-10KB gzipped)
- Built-in TypeScript typegen for route parameter type safety
- Vite-first design for optimal build performance
- Route-based code splitting with `React.lazy()` reduces initial bundle
- Use `createBrowserRouter()` API (not deprecated `BrowserRouter` component)

**From ADR 2 (Tailwind CSS v4.1):**
- Mobile-first utility classes: design for 320px base, scale up with `sm:`, `md:`, `lg:` breakpoints
- Zero runtime overhead - pure CSS, no JavaScript execution cost
- Minimal bundle impact: only ships classes actually used (~5-15KB gzipped)
- Use semantic HTML with Tailwind utilities, not `<div>` soup

**Router Configuration Pattern:**

```tsx
// src/App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router';
import { lazy, Suspense } from 'react';
import Layout from '@/components/layout/Layout';

const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'));
const Transactions = lazy(() => import('@/features/transactions/Transactions'));
const Categories = lazy(() => import('@/features/categories/Categories'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'categories', element: <Categories /> },
    ],
  },
]);

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;
```

**Layout Component Pattern:**

```tsx
// src/components/layout/Layout.tsx
import { Outlet, Link, useLocation } from 'react-router';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm">
        <nav role="navigation" className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">SmartBudget</h1>
          <div className="flex gap-4 md:gap-6">
            <Link
              to="/"
              className={`hover:text-blue-600 ${location.pathname === '/' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
            >
              Dashboard
            </Link>
            <Link
              to="/transactions"
              className={`hover:text-blue-600 ${location.pathname === '/transactions' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
            >
              Transactions
            </Link>
            <Link
              to="/categories"
              className={`hover:text-blue-600 ${location.pathname === '/categories' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
            >
              Categories
            </Link>
          </div>
        </nav>
      </header>

      <main role="main" className="flex-1 container mx-auto p-4 max-w-7xl">
        <Outlet />
      </main>

      <footer role="contentinfo" className="border-t p-4 text-center text-sm text-gray-600">
        <p>&copy; 2025 SmartBudget. Built with React + Firebase.</p>
      </footer>
    </div>
  );
}
```

### Project Structure Notes

**Target Folder Structure After Story 1.3:**

```
src/
├── features/
│   ├── dashboard/
│   │   └── Dashboard.tsx (placeholder - Epic 5)
│   ├── transactions/
│   │   └── Transactions.tsx (placeholder - Epic 3)
│   └── categories/
│       └── Categories.tsx (placeholder - Epic 4)
├── components/
│   └── layout/
│       └── Layout.tsx (NEW in this story)
├── services/ (✅ EXISTS from Story 1.2)
│   ├── auth.ts
│   ├── database.ts
│   └── firebase/
├── App.tsx (MODIFIED - add router config)
└── main.tsx (✅ EXISTS - no changes needed)
```

**Mobile-First Breakpoints:**
- Base (320px): Mobile layout, stacked navigation
- `sm:` (640px): Slightly larger spacing
- `md:` (768px): Horizontal navigation, increased gaps
- `lg:` (1024px): Desktop layout optimizations
- `xl:` (1280px): Maximum content width applied
- `2xl:` (1536px): Ultra-wide support

### Testing Standards

**From Tech Spec - Testing Guidelines:**
- Manual testing in this story (automated tests in Epic 7.6)
- Test responsive behavior at 320px, 768px, 1024px, 2560px viewports
- Verify keyboard navigation: Tab, Shift+Tab, Enter keys
- Check semantic HTML with browser DevTools accessibility panel
- Verify route code splitting in Network tab (separate chunks loaded)

**Browser Testing:**
- Chrome DevTools: Responsive mode + accessibility panel
- Test browser back/forward buttons for client-side routing
- Verify no console errors when navigating between routes

### Performance Targets

**Bundle Size Budget:**
- Current (after Story 1.2): 121.50 KB gzipped
- React Router v7 adds: ~9-10 KB gzipped
- Target after Story 1.3: <140 KB gzipped (well under 500KB budget)
- Route code splitting reduces initial bundle (lazy-loaded chunks)

**Load Performance:**
- Initial page load should complete in <1 second (baseline - no features yet)
- Route transitions should be instant (<100ms)
- Lazy-loaded routes should load in <200ms

### References

- [Epic Breakdown: docs/epics.md#Epic-1 - Story 1.3 Acceptance Criteria]
- [Tech Spec: .bmad-ephemeral/stories/tech-spec-epic-1.md#Story-1.3 - Routing & Layout]
- [Architecture: docs/architecture.md - ADR 4: React Router v7]
- [Architecture: docs/architecture.md - ADR 2: Tailwind CSS v4.1]
- [Previous Story: stories/1-2-backend-as-a-service-integration.md - Project structure and dependencies]
- [React Router v7 Docs: https://reactrouter.com/]
- [Tailwind CSS Docs: https://tailwindcss.com/docs]

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/1-3-basic-routing-layout-structure.context.xml](.bmad-ephemeral/stories/1-3-basic-routing-layout-structure.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
