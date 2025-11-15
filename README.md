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
