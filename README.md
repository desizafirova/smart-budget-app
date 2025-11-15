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
