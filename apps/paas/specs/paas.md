# @aamini PaaS Application PRD

This is the spec file describing the requirements for a custom self hostable vercel-like PaaS app. The goal is to have a beautiful and user-friendly PaaS experience. The app should make it trivial to deploy new Node.js apps. All the user needs to do is import their github directory and the app will auto-deploy anytime the user pushes to a branch.

## Technology Stack

**Frontend**: React + TanStack Start + Tailwind + Shadcn
**Backend**: TanStack Start API routes + Drizzle ORM
**Database**: PostgreSQL
**Containers**: Docker
**Package Manager**: pnpm
**Testing**: Vitest (unit/integration), Playwright (E2E)

## Functional Decomposition

### Capability: GitHub Integration

Enables authentication, webhook connections, and repository browsing via GitHub's platform.

#### Feature: GitHub OAuth Authentication

- **Description**: Authenticate users via GitHub OAuth flow and manage sessions
- **Inputs**: GitHub authorization code, client credentials, callback URL
- **Outputs**: Access token, refresh token, user profile data, session cookie
- **Behavior**: Redirect to GitHub auth page, exchange code for token, store encrypted tokens in database, create httpOnly session cookie

#### Feature: Webhook Management

- **Description**: Register and validate GitHub webhooks for repository events
- **Inputs**: Repository ID, webhook secret, event types to subscribe
- **Outputs**: Webhook registration confirmation, verified webhook payloads
- **Behavior**: Call GitHub API to register webhook, verify incoming webhook signatures using HMAC-SHA256, route events to handlers

#### Feature: Repository Browser

- **Description**: Fetch and display user's GitHub repositories
- **Inputs**: User session token, pagination parameters (page, per_page)
- **Outputs**: List of repositories with metadata (name, URL, default branch, visibility)
- **Behavior**: Call GitHub API with user token, handle pagination, cache results for 5 minutes

### Capability: Application Management

Manages application lifecycle - importing repos as apps, configuring build settings, and querying application data.

#### Feature: Repository Import

- **Description**: Create application records from selected GitHub repositories
- **Inputs**: User ID, repository ID, repository metadata from GitHub
- **Outputs**: Application database record, webhook registration status
- **Behavior**: Create app in database, link to GitHub repo, register webhook automatically, set default build configuration

#### Feature: Build Configuration

- **Description**: Configure build commands, package manager, and framework detection
- **Inputs**: Application ID, build command, package manager type, environment variables
- **Outputs**: Updated build configuration record
- **Behavior**: Detect framework from package.json, validate build command, store configuration in database, auto-detect package manager if not specified

#### Feature: Environment Variable Management

- **Description**: CRUD operations for environment variables with encryption
- **Inputs**: Application ID, variable name, variable value, is_secret flag
- **Outputs**: Encrypted environment variable records
- **Behavior**: Encrypt sensitive values using AES-256, store in database, decrypt only during build/deployment, prevent logging of secrets

#### Feature: Settings Management

- **Description**: Manage application preferences and deployment parameters
- **Inputs**: Application ID, settings object (domain, auto-deploy branch, etc.)
- **Outputs**: Updated settings record
- **Behavior**: Validate settings schema, merge with defaults, persist to database

#### Feature: Application Queries

- **Description**: Fetch application lists and details with aggregated status
- **Inputs**: User ID, application ID (for details), filter/sort parameters
- **Outputs**: List of applications or single application with build/deployment status
- **Behavior**: Join app table with latest build/deployment records, aggregate status (building, deployed, failed), return sorted results

### Capability: Deployment Engine

Automates the complete deployment lifecycle from code push to running containers.

#### Feature: Branch Monitoring

- **Description**: Process GitHub push events and trigger builds for configured branches
- **Inputs**: Webhook push event payload (branch, commit SHA, author)
- **Outputs**: Build record creation trigger
- **Behavior**: Extract branch from payload, match against app's configured deploy branch, prevent duplicate builds for same commit, queue build job

#### Feature: Build Execution

- **Description**: Execute builds with configured commands and capture output
- **Inputs**: Build ID, repository URL, commit SHA, build config (command, package manager)
- **Outputs**: Build artifacts, build logs (stdout/stderr), build status (success/failure)
- **Behavior**: Clone repository at commit SHA, install dependencies with configured package manager, execute build command, capture logs in real-time, store artifacts, update build status

#### Feature: Container Management

- **Description**: Create, start, stop, and track Docker containers for deployments
- **Inputs**: Build ID, container config (port, env vars, health check endpoint)
- **Outputs**: Container ID, container status, assigned URL/port
- **Behavior**: Create Docker container from build artifacts, assign unique port, configure reverse proxy, start container, monitor status, handle auto-restart on crash

#### Feature: Preview Deployments

- **Description**: Create temporary deployments for pull requests with auto-cleanup
- **Inputs**: Pull request webhook event, PR number, branch name
- **Outputs**: Preview deployment URL, deployment record
- **Behavior**: Trigger build for PR branch, deploy to temporary subdomain (pr-{number}.app.domain), comment PR with preview URL, cleanup deployment when PR closed/merged

#### Feature: Health Checks

- **Description**: Monitor application health via HTTP endpoint polling
- **Inputs**: Deployment ID, health check URL, polling interval, failure threshold
- **Outputs**: Health status (healthy/unhealthy), alert notifications
- **Behavior**: Poll health endpoint every N seconds, mark unhealthy after X consecutive failures, trigger alerts, log health check history

---

## Structural Decomposition

### Repository Structure

```
src/
├── lib/
│   ├── github/              # Maps to: GitHub Integration capability
│   │   ├── oauth.ts         # Maps to: GitHub OAuth Authentication feature
│   │   ├── webhooks.ts      # Maps to: Webhook Management feature
│   │   └── repos.ts         # Maps to: Repository Browser feature
│   ├── apps/                # Maps to: Application Management capability
│   │   ├── import.ts        # Maps to: Repository Import feature
│   │   ├── config.ts        # Maps to: Build Configuration, Env Var, Settings features
│   │   └── data.ts          # Maps to: Application Queries feature
│   └── deployments/         # Maps to: Deployment Engine capability
│       ├── builds.ts        # Maps to: Branch Monitoring, Build Execution features
│       ├── containers.ts    # Maps to: Container Management feature
│       └── monitoring.ts    # Maps to: Preview Deployments, Health Checks features
└── routes/
    ├── api/
    │   ├── oauth/           # API endpoints for OAuth flow
    │   ├── webhooks/        # Webhook receiver endpoints
    │   ├── repositories/    # Repository listing endpoints
    │   ├── builds/          # Build status and logs endpoints
    │   └── applications/    # Application CRUD endpoints
    ├── index.tsx            # Dashboard page
    ├── login.tsx            # Login page
    ├── project.$id.tsx      # Application detail page
    └── settings.tsx         # Application settings page
```

### Module Definitions

#### Module: lib/github/oauth.ts

- **Maps to capability**: GitHub Integration → GitHub OAuth Authentication
- **Responsibility**: Handle complete GitHub OAuth flow and session management
- **Exports**:
  - `handleGitHubAuthorization()` - Redirects user to GitHub OAuth page
  - `handleGitHubCallback(code)` - Exchanges code for access token
  - `getSession(request)` - Retrieves current user session from request

#### Module: lib/github/webhooks.ts

- **Maps to capability**: GitHub Integration → Webhook Management
- **Responsibility**: Register webhooks and verify incoming webhook signatures
- **Exports**:
  - `createWebhook(repoId, events)` - Registers webhook with GitHub API
  - `handleWebhookEvent(payload, signature)` - Routes verified events to handlers
  - `verifyWebhookSignature(payload, signature, secret)` - Validates webhook authenticity

#### Module: lib/github/repos.ts

- **Maps to capability**: GitHub Integration → Repository Browser
- **Responsibility**: Fetch user's GitHub repositories via API
- **Exports**:
  - `fetchUserRepositories(userToken, page?)` - Fetches paginated repository list

#### Module: lib/apps/import.ts

- **Maps to capability**: Application Management → Repository Import
- **Responsibility**: Create application records from GitHub repositories
- **Exports**:
  - `importRepository(userId, repoId)` - Imports repo as application

#### Module: lib/apps/config.ts

- **Maps to capability**: Application Management → Build Configuration, Env Vars, Settings
- **Responsibility**: Manage application configuration and environment variables
- **Exports**:
  - `updateBuildConfig(appId, config)` - Updates build settings
  - `setEnvVar(appId, key, value, isSecret)` - Sets environment variable
  - `getEnvVars(appId)` - Retrieves all env vars for app
  - `updateAppSettings(appId, settings)` - Updates application settings

#### Module: lib/apps/data.ts

- **Maps to capability**: Application Management → Application Queries
- **Responsibility**: Query application data and aggregate status
- **Exports**:
  - `getUserApplications(userId)` - Lists all user's applications
  - `getApplicationDetails(appId)` - Fetches single app with aggregated status

#### Module: lib/deployments/builds.ts

- **Maps to capability**: Deployment Engine → Branch Monitoring, Build Execution
- **Responsibility**: Process push events and execute builds
- **Exports**:
  - `processPushEvent(webhookPayload)` - Triggers build from push event
  - `executeBuild(buildId)` - Executes build with configured commands
  - `getBuildLogs(buildId)` - Retrieves build logs from storage
  - `streamBuildLogs(buildId)` - Streams real-time build logs via SSE

#### Module: lib/deployments/containers.ts

- **Maps to capability**: Deployment Engine → Container Management
- **Responsibility**: Manage Docker container lifecycle
- **Exports**:
  - `createContainer(buildId, config)` - Creates and starts container from build
  - `stopContainer(containerId)` - Stops running container
  - `getContainerStatus(containerId)` - Retrieves container health and status

#### Module: lib/deployments/monitoring.ts

- **Maps to capability**: Deployment Engine → Preview Deployments, Health Checks
- **Responsibility**: Manage preview deployments and health monitoring
- **Exports**:
  - `createPreviewDeployment(prNumber, branchName)` - Deploys PR to preview URL
  - `cleanupPreviewDeployment(prNumber)` - Removes preview deployment
  - `enableHealthCheck(deploymentId, config)` - Configures health check polling
  - `getHealthStatus(deploymentId)` - Returns current health status

---

## Dependency Graph

### Foundation Layer (Phase 1)

No dependencies - these are built first.

- **database-schema** (`lib/db/schema.ts`): Provides database tables and relationships
- **type-definitions** (`lib/types/`): Provides TypeScript types for all entities

### GitHub Integration Layer (Phase 2)

- **github-oauth** (`lib/github/oauth.ts`): Depends on [database-schema, type-definitions]
- **github-repos** (`lib/github/repos.ts`): Depends on [github-oauth, type-definitions]
- **github-webhooks** (`lib/github/webhooks.ts`): Depends on [github-oauth, type-definitions]

### Application Management Layer (Phase 3)

- **app-import** (`lib/apps/import.ts`): Depends on [github-repos, github-webhooks, database-schema]
- **app-config** (`lib/apps/config.ts`): Depends on [app-import, database-schema]
- **app-data** (`lib/apps/data.ts`): Depends on [app-import, database-schema]

### Deployment Layer (Phase 4)

- **builds** (`lib/deployments/builds.ts`): Depends on [github-webhooks, app-config, database-schema]
- **containers** (`lib/deployments/containers.ts`): Depends on [builds, database-schema]
- **monitoring** (`lib/deployments/monitoring.ts`): Depends on [containers, github-webhooks, database-schema]

---

## Implementation Roadmap

### Phase 1: Foundation

**Goal**: Establish database schema and type definitions

**Entry Criteria**: Clean repository, development environment configured

**Tasks**:

#### Task ID: P1.1

**Title**: Database Schema Design & Implementation
**Status**: completed
**Priority**: critical
**Description**: Design and implement database schema for users, applications, builds, deployments, env_vars, settings
**Details**:

- Create Drizzle schema definitions for all entities
- Define relationships and foreign keys
- Setup database connection and migration system
- Export schema for use in other modules

**Test Strategy**:

- Unit tests: Schema validation, constraint enforcement
- Integration tests: Migration up/down, rollback scenarios
- Acceptance: `pnpm db:migrate` succeeds, schema types exported

---

#### Task ID: P1.2

**Title**: TypeScript Type Definitions
**Status**: completed
**Priority**: critical
**Description**: Create comprehensive TypeScript type definitions for all entities
**Details**:

- Generate types from Drizzle schema
- Create additional domain types (DTOs, API responses, etc.)
- Ensure no `any` types in codebase
- Export all types from central location

**Test Strategy**:

- Unit tests: TypeScript compilation without errors
- Acceptance: All entities have exported types, strict mode passes

**Exit Criteria**: Database can be migrated successfully, all types compile without errors, foundation can be imported by other modules

**Delivers**: A solid foundation that other modules can depend on without breaking changes

---

### Phase 2: GitHub OAuth Authentication

**Goal**: Enable users to authenticate with GitHub and manage sessions

**Entry Criteria**: Phase 1 complete, GitHub OAuth app credentials configured

**Tasks**:

#### Task ID: P2.1

**Title**: GitHub OAuth Flow Implementation
**Status**: completed
**Priority**: critical
**Description**: Implement complete OAuth flow - authorization redirect, callback handling, token exchange
**Details**:

- Create `lib/github/oauth.ts` with OAuth functions
- Implement `handleGitHubAuthorization()` - redirect to GitHub
- Implement `handleGitHubCallback()` - exchange code for token
- Store tokens securely in database
- Create API routes in `routes/api/oauth/`

**Test Strategy**:

- Integration tests: Mock GitHub OAuth API, test full flow
- Unit tests: Token validation, error handling
- E2E tests: User login flow end-to-end
- Acceptance: User clicks login → redirects to GitHub → returns with session

---

#### Task ID: P2.2

**Title**: Session Management
**Status**: completed
**Priority**: critical
**Description**: Implement session creation, validation, and retrieval
**Details**:

- Implement `getSession()` function
- Create session middleware for protected routes
- Handle session expiration and refresh
- Secure session storage (httpOnly cookies)

**Test Strategy**:

- Unit tests: Session validation logic, expiration handling
- Integration tests: Session persistence across requests
- Acceptance: Protected routes require valid session

**Exit Criteria**: Users can login with GitHub, sessions are created and persisted, protected routes work

**Delivers**: Working authentication - users can login and access protected resources

---

### Phase 3: GitHub Webhooks & Repository Browsing

**Goal**: Enable webhook registration and allow users to browse their repositories

**Entry Criteria**: Phase 2 complete, users can authenticate

**Tasks**:

#### Task ID: P3.1

**Title**: Webhook Registration & Verification
**Status**: completed
**Priority**: high
**Description**: Implement webhook registration with GitHub and signature verification
**Details**:

- Create `lib/github/webhooks.ts`
- Implement `createWebhook()` - register webhook with GitHub API
- Implement `verifyWebhookSignature()` - validate webhook signatures
- Store webhook secrets securely
- Create webhook endpoint in `routes/api/webhooks/`

**Test Strategy**:

- Unit tests: Signature verification with known payloads
- Integration tests: Mock GitHub webhook API
- Acceptance: Webhook can be registered, events received and validated

---

#### Task ID: P3.2

**Title**: Webhook Event Handling
**Status**: completed
**Priority**: high
**Description**: Parse and handle different GitHub webhook event types
**Details**:

- Implement `handleWebhookEvent()` - route events to handlers
- Support push, pull_request, and deployment events
- Queue events for async processing
- Log all received events

**Test Strategy**:

- Unit tests: Event parsing, type discrimination
- Integration tests: Mock webhook payloads for each event type
- Acceptance: All supported event types are correctly parsed and logged

---

#### Task ID: P3.3

**Title**: Repository Browser Implementation
**Status**: completed
**Priority**: high
**Description**: Fetch and display user's GitHub repositories
**Details**:

- Create `lib/github/repos.ts`
- Implement `fetchUserRepositories()` - call GitHub API with user's token
- Handle pagination for users with many repos
- Cache repository data
- Create API route in `routes/api/repositories/`

**Test Strategy**:

- Unit tests: API response parsing, pagination logic
- Integration tests: Mock GitHub API responses
- Acceptance: Users see their repositories listed in UI

**Exit Criteria**: Webhooks can be registered and validated, users can browse their repositories, events are received and parsed

**Delivers**: GitHub integration is complete - users can browse repos and the platform can receive webhook events

---

### Phase 4: Application Import

**Goal**: Allow users to import GitHub repositories as applications

**Entry Criteria**: Phase 3 complete, users can browse repositories

**Tasks**:

#### Task ID: P4.1

**Title**: Repository Import Flow
**Status**: completed
**Priority**: critical
**Description**: Create application records from selected GitHub repositories
**Details**:

- Create `lib/apps/import.ts`
- Implement `importRepository(userId, repoId)` function
- Create application record in database
- Link application to GitHub repo metadata
- Register webhook for the imported repository
- Create API route in `routes/api/applications/`

**Test Strategy**:

- Integration tests: Full import flow with mocked GitHub API
- Unit tests: Application record creation, validation
- Database tests: Verify relationships, constraints
- Acceptance: User selects repo → application created → webhook registered

---

#### Task ID: P4.2

**Title**: Import UI & User Flow
**Status**: completed
**Priority**: high
**Description**: Build user interface for repository import
**Details**:

- Create repository selection UI
- Show import progress/status
- Handle import errors gracefully
- Redirect to app configuration after successful import

**Test Strategy**:

- E2E tests: Complete import flow in browser
- Integration tests: UI state management during import
- Acceptance: User can select and import repository through UI

**Exit Criteria**: Users can import repositories as applications, webhooks are automatically registered, database records are created

**Delivers**: Core application creation - users can turn GitHub repos into managed applications

---

### Phase 5: Application Configuration & Data

**Goal**: Enable application configuration and display application data in dashboard

**Entry Criteria**: Phase 4 complete, users can import applications

**Tasks**:

#### Task ID: P5.1

**Title**: Build Configuration Management
**Status**: completed
**Priority**: critical
**Description**: Allow users to configure build settings for applications
**Details**:

- Create `lib/apps/config.ts`
- Implement `updateBuildConfig()` - set build command, package manager
- Add framework detection (auto-detect from package.json)
- Implement `setEnvVar()`, `getEnvVars()` - manage environment variables
- Encrypt sensitive env vars before storage
- Create configuration UI in `routes/settings.tsx`

**Test Strategy**:

- Unit tests: Validation logic, encryption/decryption
- Integration tests: API endpoints for config CRUD
- E2E tests: User updates config through UI
- Acceptance: User can set build command, package manager, env vars

---

#### Task ID: P5.2

**Title**: Application Settings Management
**Status**: completed
**Priority**: high
**Description**: Manage application-level settings and preferences
**Details**:

- Implement `updateAppSettings()` in `lib/apps/config.ts`
- Support domain configuration, deployment parameters
- Handle settings validation
- Settings UI in application detail page

**Test Strategy**:

- Unit tests: Settings validation, default values
- Integration tests: Settings persistence
- Acceptance: User can configure app-specific settings

---

#### Task ID: P5.3

**Title**: Application Data Queries & Dashboard
**Status**: completed
**Priority**: high
**Description**: Fetch and display application lists and details
**Details**:

- Create `lib/apps/data.ts`
- Implement `getUserApplications()` - list all user's apps
- Implement `getApplicationDetails()` - fetch single app with status
- Aggregate build/deployment status for dashboard
- Create dashboard UI in `routes/index.tsx`
- Create detail page in `routes/project.$id.tsx`

**Test Strategy**:

- Unit tests: Query logic, status aggregation
- Integration tests: Database queries with test data
- E2E tests: Dashboard displays applications correctly
- Acceptance: User sees list of apps with current status

**Exit Criteria**: Users can configure build settings and env vars, dashboard displays all applications with status

**Delivers**: Complete application management - users can configure apps and view their status

---

### Phase 6: Build Execution

**Goal**: Automate build triggering and execution from GitHub push events

**Entry Criteria**: Phase 5 complete, applications are configured

**Tasks**:

#### Task ID: P6.1

**Title**: GitHub Push Event Processing
**Status**: completed
**Priority**: critical
**Description**: Process GitHub push events and trigger builds
**Details**:

- Create `lib/deployments/builds.ts`
- Implement `processPushEvent()` - extract branch, commit info
- Match webhook events to applications
- Trigger build for configured branch (usually main)
- Prevent concurrent builds for same application

**Test Strategy**:

- Unit tests: Event parsing, branch matching
- Integration tests: Mock webhook events trigger builds
- Acceptance: Push to main branch triggers build

---

#### Task ID: P6.2

**Title**: Build Execution Engine
**Status**: completed
**Priority**: critical
**Description**: Execute builds with configured commands and capture output
**Details**:

- Implement `executeBuild()` function
- Clone repository
- Install dependencies using configured package manager
- Run build command
- Capture stdout/stderr
- Store build artifacts
- Update build status in database

**Test Strategy**:

- Integration tests: Build real sample projects
- Unit tests: Command execution, error handling
- Acceptance: Build completes successfully, artifacts stored

---

#### Task ID: P6.3

**Title**: Build Log Streaming
**Status**: completed
**Priority**: high
**Description**: Stream build logs in real-time to users
**Details**:

- Implement `streamBuildLogs()` using WebSockets or SSE
- Implement `getBuildLogs()` for historical logs
- Create build log viewer UI
- Handle log persistence

**Test Strategy**:

- WebSocket tests: Real-time log streaming
- Unit tests: Log formatting, storage
- E2E tests: User sees live build output
- Acceptance: Logs visible in real-time during build

**Exit Criteria**: Push events trigger builds automatically, builds execute successfully, logs are visible in real-time

**Delivers**: Automated CI/CD - code changes automatically build

---

### Phase 7: Container Management

**Goal**: Deploy successful builds as running containers

**Entry Criteria**: Phase 6 complete, builds are executing successfully

**Tasks**:

#### Task ID: P7.1

**Title**: Container Creation & Deployment
**Status**: completed
**Priority**: critical
**Description**: Create and start containers from successful builds
**Details**:

- Create `lib/deployments/containers.ts`
- Implement `createContainer()` - package build as container
- Assign port, configure networking
- Start container
- Store container metadata in database

**Test Strategy**:

- Integration tests: Build → container → running service
- Unit tests: Container configuration generation
- Acceptance: Successful build creates running container

---

#### Task ID: P7.2

**Title**: Container Lifecycle Management
**Status**: completed
**Priority**: high
**Description**: Manage container start, stop, restart, and status
**Details**:

- Implement `stopContainer()` - graceful shutdown
- Implement `getContainerStatus()` - health and running state
- Handle container crashes (auto-restart policy)
- Container logs forwarding

**Test Strategy**:

- Integration tests: Start, stop, restart containers
- Unit tests: Status parsing, error handling
- Acceptance: Containers can be controlled through UI

---

#### Task ID: P7.3

**Title**: Container UI & Controls
**Status**: completed
**Priority**: high
**Description**: Build UI for container management
**Details**:

- Display container status in app detail page
- Add start/stop/restart buttons
- Show container logs
- Display assigned URL/port

**Test Strategy**:

- E2E tests: User controls containers through UI
- Integration tests: UI reflects actual container state
- Acceptance: User can view and control containers

**Exit Criteria**: Successful builds deploy as containers, containers are manageable through UI, status is tracked

**Delivers**: Full deployment pipeline - code pushes result in running applications

---

### Phase 8: Monitoring & Health Checks

**Goal**: Add preview deployments and health monitoring

**Entry Criteria**: Phase 7 complete, containers are running reliably

**Tasks**:

#### Task ID: P8.1

**Title**: Preview Deployment System
**Status**: completed
**Priority**: high
**Description**: Create temporary deployments for pull requests
**Details**:

- Create `lib/deployments/monitoring.ts`
- Implement `createPreviewDeployment()` - deploy PR to temporary URL
- Handle PR webhook events
- Implement `cleanupPreviewDeployment()` - remove when PR closed
- Assign unique URLs for each preview

**Test Strategy**:

- Integration tests: PR opened → preview created → PR closed → preview removed
- Unit tests: URL generation, lifecycle management
- E2E tests: Preview deployments accessible
- Acceptance: Opening PR creates preview deployment

---

#### Task ID: P8.2

**Title**: Health Check System
**Status**: completed
**Priority**: high
**Description**: Monitor application health and alert on failures
**Details**:

- Implement `enableHealthCheck()` - configure HTTP health checks
- Implement `getHealthStatus()` - current health state
- Periodic health check polling
- Alert on consecutive failures
- Display health status in dashboard

**Test Strategy**:

- Integration tests: Health check polling, failure detection
- Unit tests: Check scheduling, alert logic
- Acceptance: Failing container triggers alert

---

#### Task ID: P8.3

**Title**: Monitoring Dashboard
**Status**: completed
**Priority**: medium
**Description**: Build comprehensive monitoring UI
**Details**:

- Display uptime metrics
- Show preview deployment list
- Health check history
- Recent deployment timeline

**Test Strategy**:

- E2E tests: Dashboard displays monitoring data
- Integration tests: Real-time updates
- Acceptance: User sees complete deployment and health status

**Exit Criteria**: PR deployments work automatically, health checks are active, monitoring dashboard is functional

**Delivers**: Production-ready platform - previews, monitoring, and automated deployments
