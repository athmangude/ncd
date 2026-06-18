# Jireh Core Client - Copilot Instructions

## Project Overview

This is the Jireh Health client application - a healthcare financing platform dashboard used by all non-admin users. The application provides portals for:
- **Patient Portal**: Patient-facing features and healthcare financing
- **Healthcare Provider Portal**: Provider management and patient care
- **Guarantor Portal**: Financial guarantor management

## Tech Stack

### Core Technologies
- **Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 6.2
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 3.4 with CSS variables for theming
- **Component Library**: Radix UI (headless components)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router DOM v6

### Key Dependencies
- **Authentication**: SuperTokens (supertokens-auth-react)
- **Analytics**: Amplitude with session replay
- **Error Tracking**: Sentry
- **Forms**: React Hook Form
- **UI Components**: Radix UI primitives, shadcn/ui patterns
- **Payments**: Paystack
- **Identity Verification**: Smile Identity
- **Maps**: Mapbox GL
- **PWA**: Vite PWA plugin with custom service worker
- **Push Notifications**: Firebase Cloud Messaging

## Project Structure

```text
src/
├── Routes/           # Route components organized by portal
│   ├── Patient/      # Patient portal pages
│   ├── Healthcare/   # Healthcare provider portal pages
│   ├── Organizations/# Organization management
│   └── Admin/        # Admin pages
├── components/       # Reusable UI components (shadcn/ui based)
├── hooks/            # Custom React hooks
├── lib/              # Library utilities (firebase, utils)
├── utilities/        # Helper functions and utilities
├── data/             # Static data and constants
├── analytics/        # Analytics utilities
├── types/            # TypeScript type definitions
├── assets/           # Static assets
├── App.tsx           # Main app component
├── main.tsx          # Application entry point
└── sw.ts             # Service worker for PWA
```

## Code Style & Conventions

### TypeScript
- Use TypeScript for all files
- Prefer explicit types over `any` (though `@typescript-eslint/no-explicit-any` is disabled)
- Maximum 4 parameters per function (`max-params` rule)
- Use path aliases: `@/` for src, `@/components/*`, `@/assets/*`

### React Patterns
- Functional components with hooks only
- Follow React Hooks rules (`react-hooks/recommended`)
- Component files should primarily export components (`react-refresh/only-export-components`)
- Use React Query for server state management
- Use Zustand for client state management

### Styling
- Use Tailwind CSS utility classes
- Follow the design system variables defined in `tailwind.config.js`
- Custom colors: bubblegum, jh-green (#A8FF95), primary, secondary, muted, accent, destructive
- Use CSS variables for theming: `hsl(var(--background))`, `hsl(var(--primary))`, etc.
- Use `cn()` utility from `@/lib/utils` for conditional classes

### Component Design
- Components follow shadcn/ui patterns (Radix UI + Tailwind)
- Use Radix UI primitives for complex interactive components
- Keep components in flat structure under `src/components/`
- Use class-variance-authority (cva) for variant-based styling

### Code Formatting
- **Prettier** configuration:
  - No semicolons (`semi: false`)
  - Double quotes (`singleQuote: false`)
  - 2 spaces for indentation
  - 80 character line width
  - ES5 trailing commas
  - LF line endings

### ESLint Rules
- Extends TypeScript ESLint recommended rules
- React Hooks rules enforced
- Custom rules:
  - `@typescript-eslint/no-explicit-any`: off
  - `no-useless-escape`: off
  - `@typescript-eslint/no-unsafe-function-type`: off
  - `@typescript-eslint/no-empty-object-type`: off
  - `max-params`: error (max 4 parameters)

## Development Workflow

### Environment Setup
- Node.js 20.x required (specified in engines)
- Uses environment variables for configuration (see `env.example`)
- Three environments: development, staging, production

### Running the Application
```bash
# Local development
npm run dev

# Docker development
make build-development && make start-development  # Port 3001

# Docker staging
make build-staging && make start-staging          # Port 3002

# Docker production
make build-production && make start-production    # Port 3003
```

### Build & Lint
```bash
npm run build    # TypeScript check + Vite build
npm run lint     # ESLint with auto-fix
```

### Git Workflow
- Uses Husky for git hooks
- Lint-staged runs ESLint and Prettier on staged TypeScript/JavaScript files
- Pre-commit hook: `npm run lint` and formatting

## API Integration

### Authentication
- SuperTokens handles authentication flows
- API domain and base paths configured via environment variables
- Session management handled by SuperTokens SDK

### Data Fetching
- Use TanStack Query for server state
- Axios for HTTP requests
- Base API URL: `process.env.VITE_API_BASE_URL`

### Error Handling
- Sentry integration for error tracking and monitoring
- Environment-specific Sentry configuration
- Source maps uploaded to Sentry during build

## PWA Features

### Service Worker
- Custom service worker in `src/sw.ts`
- Implements offline capabilities and push notifications
- Firebase Cloud Messaging for push notifications
- Maximum cache size: 5MB

### Notifications
- Push notifications via Firebase
- Custom hooks: `usePushNotifications`, `useRequestNotificationAccess`
- Offline data sync: `useOfflinePatientData`

## Analytics & Monitoring

### Amplitude
- Analytics tracking with session replay
- User ID set via `useSetAmplitudeUserId` hook
- Track user interactions and events

### Sentry
- Error tracking and performance monitoring
- Release management with version injection
- Source map cleanup after upload
- Environment-specific configuration

## Security & Performance

### Build Optimization
- Minification with Terser
- Console and debugger statements removed in production
- Source maps generated and uploaded to Sentry
- Tree shaking and code splitting via Vite

### Authentication & Access Control
- SuperTokens handles secure authentication
- Tenant-based access control via `useTenantAccessControl`
- Route protection via authentication guards

## Common Patterns

### Custom Hooks
- Location permissions: `useLocationPermission`
- Form persistence: `usePersistentForm`
- PWA install: `usePwaInstall`
- Toast notifications: `useToast`
- Patient data: `usePatientLoginDetails`, `useOfflinePatientData`

### Utilities
- Currency formatting: `src/utilities/currencyUtilities.tsx`
- Date handling: `src/utilities/dateUtilities.tsx`
- Local storage: `src/utilities/localStorage.tsx`
- Text utilities: `src/utilities/textUtilities.tsx`
- Validators: `src/utilities/validators.tsx`

## Important Notes

### When Making Changes
1. **Maintain TypeScript types** - Keep type safety throughout
2. **Follow existing patterns** - Match the shadcn/ui component style
3. **Use path aliases** - Always use `@/` imports for consistency
4. **Respect the design system** - Use Tailwind classes and CSS variables
5. **Test in all portals** - Changes may affect Patient, Healthcare, or Guarantor portals
6. **Consider offline mode** - Some features need offline support
7. **Verify responsive design** - Application is mobile-first (PWA)
8. **Check lint rules** - Run `npm run lint` before committing
9. **Update types** - Keep TypeScript definitions in sync

### Avoid
- Don't add semicolons (Prettier config)
- Don't exceed 4 function parameters (ESLint rule)
- Don't ignore the component file structure
- Don't modify the service worker without understanding PWA implications
- Don't hardcode API URLs (use environment variables)
- Don't skip linting (enforced by Husky pre-commit)

## Contact & Resources

- Project uses Vercel Vite React template as foundation
- Component library follows shadcn/ui conventions
- Healthcare domain context required for understanding business logic
