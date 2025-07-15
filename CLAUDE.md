# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Basketball Review is a multi-tenant SaaS application for tracking basketball game statistics. It features a React/TypeScript frontend with mock mode for local development and an AWS backend using CDK for infrastructure.

## Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start dev server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Run tests
npm test
npm run test:watch  # Watch mode

# Run a specific test file
npm test tests/video-processing.test.js

# Run tests with coverage
npm test -- --coverage

# Preview production build
npm run preview
```

### CDK/Backend Development
```bash
# Install all dependencies (frontend + CDK)
npm run install:all

# CDK commands (run from project root)
npm run cdk:build    # Compile TypeScript
npm run cdk:synth    # Synthesize CloudFormation
npm run cdk:deploy   # Deploy to AWS
npm run cdk:destroy  # Tear down stack

# Direct CDK commands (from cdk/ directory)
cd cdk
npm run deploy       # Deploy stack
npm run db:scan      # Scan DynamoDB table
npm run db:clear     # Clear DynamoDB data
npm run db:players   # View players data
npm run db:teams     # View teams data
npm run db:games     # View games data
npm run db:backup    # Backup DynamoDB data
npm run db:shell     # Access DynamoDB shell
```

## Architecture Overview

### Frontend Structure
The application uses a component-based architecture with clear separation of concerns:

- **Components**: React components organized by feature (GameReview/, TeamManagement/, PlayerProfiles/, etc.)
- **Hooks**: Custom React hooks for state management (useGameStats, useGameClock, useTeamManagement)
- **Services**: API layer with mock mode support (`src/services/api.ts`)
- **Utils**: Shared utilities for calculations, formatting, and logging
- **UI Components**: Reusable UI components in `src/components/ui/` (Button, GameButton, modals)

### Backend Architecture (AWS CDK)
The backend uses a serverless architecture deployed via AWS CDK:

- **DynamoDB**: Single table design with composite keys (PK/SK pattern) for multi-tenancy
- **Lambda Functions**: Separate functions for each resource type (players/, teams/, games/, uploads/)
- **API Gateway**: REST API with CORS enabled
- **S3**: File uploads for player/team images
- **CloudFront**: CDN for static assets

### Key Design Patterns

1. **Multi-Tenant Data Model**:
   - All data is partitioned by Organization ID (OrgId)
   - Composite keys: `PK: ORG#${orgId}#RESOURCE#${id}`, `SK: RESOURCE#${id}`
   - GSI for querying by organization and type

2. **Mock Mode for Local Development**:
   - Controlled by `VITE_MOCK_API=true` environment variable
   - Uses localStorage to persist data locally
   - Mirrors the exact API structure for seamless switching

3. **Shared Lambda Utilities**:
   - Common CORS headers, error handling, and DynamoDB config in `cdk/lambda/utils/common.js`
   - Consistent response format across all endpoints

4. **Logging Strategy**:
   - Custom logger utility (`src/utils/logger.ts`) that respects environment
   - Console logs automatically stripped in production builds
   - CloudWatch logging for Lambda functions

5. **Game State Management**:
   - useGameStats hook manages player statistics and game state
   - useGameClock hook handles game timing and period management
   - Real-time plus/minus tracking and stat calculations

6. **Component Communication**:
   - Landing page → Main app navigation via state
   - Tab-based navigation for different features
   - Modal system for forms and confirmations

## Environment Configuration

Create a `.env` file from `.env.example`:

```bash
# Required for local development
VITE_MOCK_API=true              # Use mock API (localStorage)
VITE_INIT_MOCK_DATA=false       # Initialize with sample data

# Required for production
VITE_API_URL=https://your-api-gateway-url.amazonaws.com
CDK_DEFAULT_ACCOUNT=your-aws-account-id
CDK_DEFAULT_REGION=us-east-1

# Optional
VITE_ENABLE_LOGGING=false       # Enable logging in production
VITE_LOG_LEVEL=info            # Log level: debug|info|warn|error
```

## Working with Mock Mode

Mock mode allows full local development without AWS:

1. **Data Persistence**: All data stored in localStorage with prefix `basketball-mock-`
2. **File Uploads**: Images stored as data URLs
3. **Multi-Tenant**: Organization ID stored in localStorage
4. **API Compatibility**: Exact same API structure as production

To clear mock data:
```javascript
// In browser console
Object.keys(localStorage)
  .filter(key => key.startsWith('basketball-mock-'))
  .forEach(key => localStorage.removeItem(key));
```

## CDK Stack Details

The infrastructure is defined in `cdk/lib/basketball-review-stack.ts`:

- **Table Name**: `BasketballReview`
- **GSI**: `OrgTypeIndex` (for querying by organization)
- **S3 Bucket**: `basketball-review-uploads-${ACCOUNT_ID}`
- **Lambda Runtime**: Node.js 18.x
- **API Gateway**: REST API with `{proxy+}` routing

## UI/UX Patterns

1. **Button System**:
   - Base Button component with variant system (primary, secondary, success, danger, etc.)
   - GameButton wrapper adds click animation (green flash) for game action buttons
   - Border highlight on hover instead of scale effects

2. **Game Review Layout**:
   - Single unified scoreboard showing scores, fouls, timeouts, and game clock
   - Consolidated stat tracking section with player stats and game management
   - Live box score with edit/delete capabilities

3. **Player Management**:
   - On-court (5 players max) and bench player sections
   - Real-time substitution system
   - Stat correction and deletion modals

## Testing Strategy

- Jest configuration in root `package.json`
- Test files located in `tests/` directory
- Coverage thresholds: 80% for all metrics (branches, functions, lines, statements)
- Mock implementations for API calls and localStorage

## Important Considerations

1. **Always run linter before committing**: The project enforces strict linting rules
2. **Mock mode first**: Develop features in mock mode before testing with AWS
3. **Organization context**: All API calls require `X-Org-Id` header
4. **Image handling**: Images are base64 encoded in mock mode, S3 URLs in production
5. **Test coverage**: Maintain 80% coverage threshold for all metrics
6. **TypeScript strict mode**: Avoid using `any` types, properly type all data structures

## Recent Updates

- Unified game review scoreboard to eliminate duplication
- Added GameButton component for visual feedback on clicks
- Replaced button scale hover effects with border highlights
- Consolidated opponent scoring and timeout controls into stat tracking section
- Removed unused ScoreBoard component