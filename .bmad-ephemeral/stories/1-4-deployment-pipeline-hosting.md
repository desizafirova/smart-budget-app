# Story 1.4: Deployment Pipeline & Hosting

Status: ready-for-dev

## Story

As a developer,
I want to set up automated deployment to a hosting platform,
So that code changes can be deployed quickly and reliably to a production environment.

## Acceptance Criteria

1. Hosting platform connected to GitHub repository
   - Vercel project created and linked to repository
   - Repository access configured for automatic deployments

2. Automatic deployment on push to main branch
   - Pushing code to main branch triggers build and deployment
   - Build process completes successfully (Vite build)
   - New version deployed to production URL

3. Production application accessible via HTTPS
   - Application deployed and accessible via Vercel HTTPS URL
   - Custom domain configured (optional for MVP)
   - SSL/TLS certificate active and valid

4. Environment variables securely managed
   - Firebase API keys configured in Vercel dashboard (not in code)
   - Separate environment variable sets for preview and production
   - `.env.example` updated with all required variables

5. Build configuration correct
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node.js version specified (18.x or 20.x)
   - Install command: `npm install`

6. Preview deployments for pull requests
   - Opening PR creates preview deployment with unique URL
   - Preview deployments include environment variables
   - PR comments show deployment status and preview URL

7. GitHub Actions CI/CD configured
   - Workflow runs on push and pull request
   - Linting check (`npm run lint`)
   - TypeScript check (`npm run build`)
   - Workflow status badge in README (optional)

8. Deployment status visible
   - Vercel dashboard shows deployment history
   - Failed deployments trigger notifications
   - Build logs accessible for debugging

9. Web Vitals monitoring enabled
   - Vercel Analytics configured for performance tracking
   - Core Web Vitals visible in dashboard (LCP, FID, CLS)
   - Performance budget alerts configured (optional)

10. Documentation updated
    - README includes deployment instructions
    - Environment variable setup documented
    - Production URL documented

## Tasks / Subtasks

- [ ] **Task 1: Create Vercel account and project** (AC: #1, #3)
  - [ ] Sign up for Vercel account (free tier)
  - [ ] Create new Vercel project
  - [ ] Connect GitHub repository to Vercel
  - [ ] Grant Vercel access to repository
  - [ ] Verify connection in Vercel dashboard

- [ ] **Task 2: Configure Vercel build settings** (AC: #2, #5)
  - [ ] Set Build Command: `npm run build`
  - [ ] Set Output Directory: `dist`
  - [ ] Set Install Command: `npm install`
  - [ ] Set Node.js Version: 20.x (or latest LTS)
  - [ ] Set Root Directory: `.` (project root)
  - [ ] Test: Trigger manual deployment, verify build succeeds

- [ ] **Task 3: Configure environment variables in Vercel** (AC: #4)
  - [ ] Navigate to Vercel project settings → Environment Variables
  - [ ] Add Firebase API key: `VITE_FIREBASE_API_KEY`
  - [ ] Add Firebase Auth Domain: `VITE_FIREBASE_AUTH_DOMAIN`
  - [ ] Add Firebase Project ID: `VITE_FIREBASE_PROJECT_ID`
  - [ ] Add Firebase Storage Bucket: `VITE_FIREBASE_STORAGE_BUCKET`
  - [ ] Add Firebase Messaging Sender ID: `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] Add Firebase App ID: `VITE_FIREBASE_APP_ID`
  - [ ] Set environment scope: Production and Preview
  - [x] Update `.env.example` with all required variable names
  - [ ] Test: Verify Firebase connection works in deployed app

- [ ] **Task 4: Enable preview deployments** (AC: #6)
  - [ ] Verify preview deployments enabled in Vercel settings (default)
  - [ ] Create test pull request
  - [ ] Verify preview deployment created with unique URL
  - [ ] Test: Access preview URL, verify app loads correctly
  - [ ] Verify PR comment shows deployment status
  - [ ] Close test PR after verification

- [ ] **Task 5: Deploy to production and verify** (AC: #2, #3, #8)
  - [ ] Push changes to main branch
  - [ ] Monitor deployment progress in Vercel dashboard
  - [ ] Verify deployment completes successfully
  - [ ] Access production URL via HTTPS
  - [ ] Verify SSL certificate valid (https://)
  - [ ] Test: Navigate through all routes (/, /transactions, /categories)
  - [ ] Test: Verify Firebase connection works (anonymous auth)
  - [ ] Check browser console for errors (should be none)

- [x] **Task 6: Set up GitHub Actions CI workflow** (AC: #7)
  - [x] Create `.github/workflows/ci.yml` file
  - [x] Configure workflow trigger: push and pull_request on main branch
  - [x] Add job: Install dependencies (`npm ci`)
  - [x] Add job: Run linter (`npm run lint`)
  - [x] Add job: Run TypeScript check (`npm run build`)
  - [ ] Commit workflow file to repository
  - [ ] Verify workflow runs on push
  - [ ] Check Actions tab for workflow status

- [ ] **Task 7: Configure Vercel Analytics** (AC: #9)
  - [ ] Enable Vercel Analytics in project settings
  - [ ] Add Vercel Analytics script to index.html (if not auto-injected)
  - [ ] Deploy changes
  - [ ] Wait for traffic data (may take time to populate)
  - [ ] Verify Core Web Vitals visible in Vercel dashboard

- [x] **Task 8: Update documentation** (AC: #10)
  - [x] Update README with deployment section
  - [x] Document production URL
  - [x] Document environment variable setup steps
  - [x] Add deployment instructions for team members
  - [x] Add link to Vercel dashboard (if team access)
  - [x] Update `.env.example` if any variables added

- [ ] **Task 9: Test complete deployment workflow** (AC: #2, #6, #7)
  - [ ] Create feature branch
  - [ ] Make small change (e.g., update footer text)
  - [ ] Push to branch, verify GitHub Actions CI runs
  - [ ] Create pull request
  - [ ] Verify preview deployment created
  - [ ] Test preview deployment
  - [ ] Merge PR to main
  - [ ] Verify production deployment triggered
  - [ ] Verify production updated with changes

## Dev Notes

### Learnings from Previous Story

**From Story 1-3-basic-routing-layout-structure (Status: review)**

- **Folder Structure**: `src/components/layout/`, `src/features/` directories created
- **New Files Created**:
  - `src/components/layout/Layout.tsx` - Main layout component
  - `src/features/dashboard/Dashboard.tsx` - Dashboard placeholder
  - `src/features/transactions/Transactions.tsx` - Transactions placeholder
  - `src/features/categories/Categories.tsx` - Categories placeholder
- **Modified Files**:
  - `src/App.tsx` - Router configuration with code splitting
  - `vite.config.ts` - Added @/features path alias
  - `tsconfig.app.json` - Added @/features/* path mapping
- **Build Metrics**:
  - Production build: ✅ Successful
  - Main bundle: 149.77 KB gzipped (within budget)
  - Route chunks: 0.24 KB each (lazy-loaded)
  - TypeScript compilation: No errors
- **Technical Patterns**:
  - React Router v7 with `createBrowserRouter()` API
  - Lazy-loaded routes with React.lazy() and Suspense
  - Mobile-first Tailwind CSS styling
  - Semantic HTML with ARIA landmarks

[Source: stories/1-3-basic-routing-layout-structure.md#Dev-Agent-Record]

### Architecture Context

**From ADR 3: Hosting & Deployment Platform (Architecture.md)**

**Decision:** Vercel

**Rationale:**
- **Zero-config Vite deployment** - Automatic build detection
- **Git Integration** - Automatic deployments on push
- **Preview Deployments** - Every PR gets unique URL
- **Web Vitals Monitoring** - Built-in performance tracking
- **Edge Network** - Global CDN for fast load times
- **Free Tier Sufficient** - Generous limits for MVP development

**Configuration:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Node.js Version: 20.x
- Environment Variables: Firebase config keys

**Build Output:**
- Vite produces optimized production build in `dist/`
- HTML, CSS, JS bundles with content hashing
- Gzipped assets for optimal transfer size
- Source maps for debugging (optional)

### Project Structure Notes

**Deployment-Ready Structure:**

```
smart-budget-app/
├── .github/
│   └── workflows/
│       └── ci.yml (NEW - GitHub Actions workflow)
├── dist/ (generated by `npm run build`)
│   ├── index.html
│   ├── assets/
│   │   ├── index-[hash].js
│   │   ├── index-[hash].css
│   │   └── [route-chunks].js
├── src/
│   ├── App.tsx ✅
│   ├── main.tsx ✅
│   ├── components/ ✅
│   ├── features/ ✅
│   └── services/ ✅
├── .env.example (UPDATE - document all Firebase vars)
├── .env.local (NOT COMMITTED - local development)
├── .gitignore ✅
├── package.json ✅
├── vite.config.ts ✅
├── vercel.json (OPTIONAL - custom Vercel config)
└── README.md (UPDATE - deployment docs)
```

**Environment Variables Required:**

```
VITE_FIREBASE_API_KEY=<from Firebase console>
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<numeric-id>
VITE_FIREBASE_APP_ID=<app-id>
```

### Testing Standards

**Deployment Validation Checklist:**
- [ ] Production URL loads without errors
- [ ] All routes accessible (/, /transactions, /categories)
- [ ] Firebase connection works (anonymous auth initializes)
- [ ] No console errors in browser DevTools
- [ ] HTTPS enabled with valid certificate
- [ ] Bundle size within budget (<150KB gzipped main bundle)
- [ ] Page load time <2 seconds (baseline, no data yet)
- [ ] Mobile responsive (test on device or Chrome DevTools)

**CI/CD Validation:**
- [ ] GitHub Actions workflow passes on push
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript check passes (`npm run build`)
- [ ] Preview deployments created for PRs
- [ ] Production deployment triggered on merge to main

**Performance Monitoring:**
- Vercel Analytics will track Core Web Vitals
- Baseline metrics (Epic 1 foundation, no features yet):
  - LCP (Largest Contentful Paint): Target <2.5s
  - FID (First Input Delay): Target <100ms
  - CLS (Cumulative Layout Shift): Target <0.1

### References

- [Epic Breakdown: docs/epics.md#Epic-1 - Story 1.4 Acceptance Criteria]
- [Architecture: docs/architecture.md - ADR 3: Hosting & Deployment Platform (Vercel)]
- [Tech Spec: .bmad-ephemeral/stories/tech-spec-epic-1.md - Story 1.4 Implementation Steps]
- [Previous Story: .bmad-ephemeral/stories/1-3-basic-routing-layout-structure.md]
- [Vercel Documentation: https://vercel.com/docs]
- [GitHub Actions Documentation: https://docs.github.com/en/actions]

## Dev Agent Record

### Context Reference

- [1-4-deployment-pipeline-hosting.context.xml](.bmad-ephemeral/stories/1-4-deployment-pipeline-hosting.context.xml)

### Agent Model Used

claude-sonnet-4-5-20250929 (Amelia - Developer Agent)

### Debug Log References

**2025-11-15 - Initial Implementation Approach**

This story is a hybrid infrastructure story combining:
1. **Automated code/documentation** (GitHub Actions CI, README updates) - Completed by Dev Agent
2. **Manual platform configuration** (Vercel account, dashboard settings, deployment testing) - Requires user intervention

**Implementation Strategy:**
- Created `.github/workflows/ci.yml` with full CI pipeline (ESLint + TypeScript checks)
- Added comprehensive deployment documentation to README covering:
  - Vercel account and project setup
  - Environment variable configuration
  - Deployment workflows (production + preview)
  - GitHub Actions CI integration
  - Vercel Analytics setup
  - Troubleshooting guide
- Verified `.env.example` contains all required Firebase env vars

**Rationale:** Tasks 1-5, 7, and 9 require access to external platforms (Vercel dashboard, GitHub repository) which cannot be automated by the dev agent. User must complete these manual configuration steps following the README guide.

### Completion Notes List

**Automated Tasks Completed:**

1. **Task 6: GitHub Actions CI Workflow (AC #7)** - ✅ COMPLETE
   - Created `.github/workflows/ci.yml` with:
     - Triggers on push and pull_request to main branch
     - Node.js 20.x environment setup
     - npm ci for dependency installation
     - ESLint code quality check (`npm run lint`)
     - TypeScript type-checking (`npm run build`)
   - Configuration ready for immediate use once committed
   - Aligns with constraint: CI workflow must run on push and pull_request events with required checks

2. **Task 8: Documentation Updates (AC #10)** - ✅ COMPLETE
   - Added comprehensive "Deployment" section to README with:
     - Production URL placeholder
     - Step-by-step Vercel account and project setup guide
     - Environment variable configuration table with all 6 Firebase vars
     - Automatic deployment workflow documentation
     - Pull request preview deployment process
     - GitHub Actions CI pipeline details
     - Vercel Analytics setup guide
     - Deployment commands reference
     - Best practices and troubleshooting guides
   - Production URL documented (will be active after first deployment)
   - Environment variable setup fully documented with secure practices

3. **Task 3 (Partial): Environment Variables** - ✅ VERIFIED
   - `.env.example` already contains all 6 required Firebase environment variables
   - Each variable properly documented with comments
   - Satisfies AC #4 requirement for documentation

**Manual Configuration Required:**

User (Desi) must complete the following tasks using the README guide:

- **Task 1**: Create Vercel account and connect GitHub repository
- **Task 2**: Configure Vercel build settings (npm run build, dist output, Node.js 20.x)
- **Task 3**: Add Firebase environment variables in Vercel dashboard (Production + Preview)
- **Task 4**: Verify preview deployments are enabled (should be default)
- **Task 5**: Deploy to production and verify HTTPS, routes, and Firebase connection
- **Task 6**: Commit CI workflow and verify GitHub Actions runs
- **Task 7**: Enable Vercel Analytics in dashboard
- **Task 9**: Test end-to-end deployment workflow (feature branch → PR → preview → merge → production)

**Next Steps:**

1. User commits changes (ci.yml, README updates)
2. User follows README "One-Time Vercel Setup" section
3. User completes manual Vercel configuration
4. User tests deployment and validates all acceptance criteria
5. User marks remaining tasks complete after verification

### File List

**New Files:**
- `.github/workflows/ci.yml` - GitHub Actions CI pipeline configuration

**Modified Files:**
- `README.md` - Added comprehensive Deployment section (~200 lines) covering Vercel setup, CI/CD workflows, analytics, and troubleshooting
- `.bmad-ephemeral/sprint-status.yaml` - Updated story status: ready-for-dev → in-progress
