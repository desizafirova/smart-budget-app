# SmartBudget MVP

SmartBudget is a personal finance tracking web application designed to deliver **instant visual clarity** the moment a transaction is logged. Built with React, TypeScript, and Firebase for real-time synchronization and offline support.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0 (LTS recommended)
- **npm** >= 10.0.0

You can verify your versions with:

```bash
node --version
npm --version
```

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd smart-budget-app
```

2. Install dependencies:

```bash
npm install
```

## Firebase Setup

SmartBudget uses Firebase for authentication, real-time database, and offline synchronization. You'll need to create Firebase projects and configure environment variables.

### 1. Create Firebase Projects

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a **development project**: `smartbudget-dev`
3. Create a **production project**: `smartbudget-prod`

### 2. Enable Firebase Services

For both projects, enable the following services:

**Authentication:**
1. Go to **Build → Authentication**
2. Click "Get started"
3. Sign-in methods will be configured in later epics

**Firestore Database:**
1. Go to **Build → Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (we'll configure security rules)
4. Select your preferred region

### 3. Get Web App Configuration

For each project:

1. Go to **Project Settings** (⚙️ icon)
2. Under "Your apps", click the Web icon `</>`
3. Register app with nickname (e.g., "SmartBudget Dev")
4. Copy the `firebaseConfig` object

### 4. Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and replace placeholder values with your **development** Firebase config:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**⚠️ Important:**
- The `.env` file is excluded from git (see `.gitignore`)
- Never commit Firebase credentials to version control
- Production credentials will be configured in your deployment platform (Vercel)

### 5. Configure Firestore Security Rules

For both projects, set restrictive baseline rules:

1. Go to **Build → Firestore Database → Rules**
2. Replace rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

> User-scoped security rules will be implemented in Epic 2+ when authentication is added.

### BaaS Abstraction Layer

SmartBudget uses an abstraction layer pattern to avoid vendor lock-in:

**Service Interfaces:**
- `src/services/auth.ts` - `IAuthService` interface for authentication
- `src/services/database.ts` - `IDatabaseService` interface for database operations

**Firebase Implementations:**
- `src/services/firebase/firebaseAuth.ts` - Firebase Auth implementation
- `src/services/firebase/firebaseDatabase.ts` - Firestore implementation

**Usage in Application Code:**

```typescript
// ✅ Import interfaces, not Firebase SDK
import { IAuthService } from '@/services/auth';
import { IDatabaseService } from '@/services/database';

// ✅ Use service implementations
import authService from '@/services/firebase/firebaseAuth';
import databaseService from '@/services/firebase/firebaseDatabase';

// ❌ Never import Firebase SDK directly outside /services/firebase/
// import { signInAnonymously } from 'firebase/auth'; // WRONG
```

This pattern enables future migration to other BaaS providers (Supabase, custom backend) without changing application code.

## Development Workflow

### Start Development Server

```bash
npm run dev
```

Opens the development server at [http://localhost:5173](http://localhost:5173) with hot module replacement (HMR).

### Build for Production

```bash
npm run build
```

Compiles TypeScript and bundles the application for production into the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

Locally preview the production build.

### Linting and Formatting

Run ESLint to check code quality:

```bash
npm run lint
```

Format code with Prettier:

```bash
npm run format
```

## Deployment

SmartBudget uses **Vercel** for hosting with automatic deployments triggered by Git pushes. **GitHub Actions** provides continuous integration (linting and type-checking) before deployment.

### Production URL

🌐 **Live Application:** [https://smart-budget-app.vercel.app](https://smart-budget-app.vercel.app)
*(URL will be available after first deployment)*

### Prerequisites

- GitHub repository with code pushed
- Vercel account (free tier)
- Firebase production project credentials

### One-Time Vercel Setup

#### 1. Create Vercel Account and Project

1. Go to [vercel.com](https://vercel.com) and sign up/sign in with your GitHub account
2. Click **"Add New..." → Project**
3. **Import your GitHub repository:**
   - Find `smart-budget-app` in the repository list
   - Click **Import**
4. **Configure Project Settings:**
   - **Framework Preset:** Vite (should auto-detect)
   - **Root Directory:** `.` (leave as project root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Node.js Version:** 20.x
5. **DO NOT** click Deploy yet - we need to add environment variables first

#### 2. Configure Environment Variables in Vercel

1. In your Vercel project, go to **Settings → Environment Variables**
2. Add the following variables from your **production** Firebase project:

| Variable Name | Example Value | Scope |
|--------------|---------------|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyC...` | Production, Preview |
| `VITE_FIREBASE_AUTH_DOMAIN` | `smartbudget-prod.firebaseapp.com` | Production, Preview |
| `VITE_FIREBASE_PROJECT_ID` | `smartbudget-prod` | Production, Preview |
| `VITE_FIREBASE_STORAGE_BUCKET` | `smartbudget-prod.firebasestorage.app` | Production, Preview |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | Production, Preview |
| `VITE_FIREBASE_APP_ID` | `1:123456789:web:abc123` | Production, Preview |

3. For each variable:
   - Enter **Name** (e.g., `VITE_FIREBASE_API_KEY`)
   - Enter **Value** (paste from Firebase Console)
   - Select **Environments:** Check both `Production` and `Preview`
   - Click **Save**

**⚠️ Security Note:** Never commit these values to git. They're securely stored in Vercel and injected at build time.

#### 3. Deploy to Production

1. After adding environment variables, go to **Deployments** tab
2. Click **Deploy** (or trigger by pushing to `main` branch)
3. Wait for deployment to complete (~2-3 minutes)
4. Vercel will display your production URL: `https://smart-budget-app.vercel.app`
5. Visit the URL and verify the app loads correctly

#### 4. Verify Deployment

**Post-Deployment Checklist:**

- [ ] Production URL loads via HTTPS
- [ ] SSL certificate is valid (check browser lock icon)
- [ ] All routes navigate correctly: `/`, `/transactions`, `/categories`
- [ ] Firebase connection works (check browser console - no errors)
- [ ] Bundle size is within budget (<150KB gzipped for Epic 1 foundation)
- [ ] Page loads in <2 seconds on 4G connection

**Troubleshooting:**

- **Build fails:** Check build logs in Vercel dashboard. Common issues:
  - TypeScript errors → Run `npm run build` locally to reproduce
  - Missing dependencies → Verify `package.json` is committed
  - Node.js version → Ensure 20.x is selected in Vercel settings
- **App loads but Firebase errors:** Verify environment variables in Vercel dashboard match your Firebase config
- **404 errors on routes:** Vercel should auto-configure SPA routing for Vite. If issues persist, create `vercel.json`:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

### Automatic Deployment Workflow

#### Push to Main Branch (Production)

```bash
# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to main branch
git push origin main
```

**What happens:**
1. GitHub Actions CI runs (linting + type-checking)
2. If CI passes, Vercel automatically builds and deploys
3. New version goes live at production URL within 2-3 minutes
4. Vercel posts deployment status to GitHub commit

#### Pull Request Workflow (Preview Deployments)

```bash
# Create feature branch
git checkout -b feature/add-feature

# Make changes and push
git add .
git commit -m "feat: implement feature"
git push origin feature/add-feature

# Create pull request on GitHub
```

**What happens:**
1. GitHub Actions CI runs automatically
2. Vercel creates a **preview deployment** with unique URL
3. Preview URL is posted as comment on the PR
4. Test changes on preview URL before merging
5. When PR is merged to main, Vercel deploys to production

**Preview Deployment Benefits:**
- Test features in production-like environment before merging
- Share preview URLs with team for review
- Automatically includes environment variables
- No impact on production until merge

### GitHub Actions CI Pipeline

Continuous integration runs automatically on every push and pull request.

**CI Checks:**
- ✅ Install dependencies with `npm ci`
- ✅ Run ESLint: `npm run lint`
- ✅ Run TypeScript check: `npm run build`

**View CI Status:**
- Go to GitHub repository → **Actions** tab
- Each workflow run shows pass/fail status
- Click on a run to view detailed logs
- Failed runs block PR merges (if branch protection enabled)

**Configuration:** `.github/workflows/ci.yml`

### Vercel Analytics (Optional)

Track performance metrics and Core Web Vitals in production.

**Enable Analytics:**
1. In Vercel project, go to **Analytics** tab
2. Click **Enable Web Analytics**
3. Analytics will automatically inject tracking script
4. Wait 24-48 hours for data to populate

**Available Metrics:**
- **Largest Contentful Paint (LCP):** Target <2.5s
- **First Input Delay (FID):** Target <100ms
- **Cumulative Layout Shift (CLS):** Target <0.1
- Real User Monitoring (RUM) data from actual users
- Performance scores by device, browser, and region

### Deployment Commands Reference

```bash
# Trigger production deployment (via push)
git push origin main

# View deployment logs
# Visit Vercel dashboard → Deployments → Click on deployment

# Rollback to previous deployment
# Vercel dashboard → Deployments → Click "..." → Promote to Production

# View environment variables
# Vercel dashboard → Settings → Environment Variables

# Force redeploy (no code changes)
# Vercel dashboard → Deployments → Click "..." → Redeploy
```

### Deployment Best Practices

1. **Always test locally before pushing:**
   ```bash
   npm run build    # Verify build succeeds
   npm run lint     # Check for linting errors
   npm run preview  # Test production build locally
   ```

2. **Use feature branches and PRs:**
   - Never commit directly to `main`
   - Create feature branch → PR → Review → Merge
   - Leverage preview deployments for testing

3. **Monitor deployment status:**
   - Check GitHub Actions for CI status
   - Check Vercel dashboard for build logs
   - Verify production URL after deployment

4. **Keep dependencies updated:**
   - Run `npm outdated` regularly
   - Update dependencies in separate PRs
   - Test thoroughly after major version bumps

5. **Bundle size monitoring:**
   - After deployment, check Vercel analytics for bundle size
   - Target: <500KB gzipped (current Epic 1 baseline: ~150KB)
   - Use `npm run build` locally to see size breakdown

### Troubleshooting Deployments

**Problem:** Deployment fails with "Build Error"
- **Solution:** Run `npm run build` locally to reproduce error. Check Vercel logs for detailed stack trace.

**Problem:** Environment variables not working
- **Solution:** Verify variables are set for both Production AND Preview environments in Vercel settings. Redeploy after changes.

**Problem:** Routes return 404 after deployment
- **Solution:** Vite projects should work out of the box. If issues persist, add `vercel.json` with SPA rewrite rule (see above).

**Problem:** CI failing but code works locally
- **Solution:** Ensure `package-lock.json` is committed. CI uses `npm ci` which requires lock file. Check Node.js version matches (20.x).

**Problem:** Slow deployments (>5 minutes)
- **Solution:** Normal for first deployment. Subsequent deployments use caching and complete in 2-3 minutes. Check Vercel status page for platform issues.

## Project Structure

```
smart-budget-app/
├── src/
│   ├── features/           # Feature modules (auth, transactions, dashboard, categories)
│   ├── services/           # BaaS abstraction layer (Firebase)
│   ├── stores/             # Zustand state management stores
│   ├── components/         # Shared UI components
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── tests/                  # Test files (Vitest, Playwright)
├── docs/                   # Project documentation
├── dist/                   # Production build output (generated)
└── ...config files
```

## Technology Stack

- **Frontend Framework:** React 19.2+
- **Build Tool:** Vite 7.2+
- **Language:** TypeScript 5.9+ (strict mode)
- **Styling:** Tailwind CSS 4.1
- **State Management:** Zustand 5.0.8
- **Backend-as-a-Service:** Firebase 12.4.0
- **Routing:** React Router 7
- **Charts:** Chart.js 4.5.1 + react-chartjs-2 5.3.0
- **Forms:** React Hook Form 7.66.0
- **Date Handling:** Day.js 1.11.18
- **Icons:** Lucide React 0.553.0
- **Testing:** Vitest 2.0, @testing-library/react 16.1, Playwright 1.50
- **Code Quality:** ESLint 9.0, Prettier 3.4

## Path Aliases

The project uses path aliases for cleaner imports:

```typescript
import { Button } from '@/components/Button';
import { authStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/format-currency';
```

Available aliases:
- `@/components` → `src/components`
- `@/services` → `src/services`
- `@/stores` → `src/stores`
- `@/utils` → `src/utils`
- `@/types` → `src/types`
- `@/hooks` → `src/hooks`

## Documentation

- [Architecture Decisions](docs/architecture.md) - Technical architecture and ADRs
- [Product Requirements](docs/PRD.md) - Product vision and requirements
- [Epic Breakdown](docs/epics.md) - Feature breakdown by epic
- [UX Design Specification](docs/ux-design-specification.md) - UI/UX guidelines

## Performance Targets

- **Chart render/update:** <500ms (99th percentile) ⭐
- **Transaction save:** <2 seconds
- **Page load (FCP):** <1.5 seconds on 4G mobile
- **Bundle size:** <500KB gzipped
- **Dev server start:** <3 seconds
- **HMR updates:** <200ms

## License

Private - All rights reserved
