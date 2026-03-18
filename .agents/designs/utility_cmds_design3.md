# Design 3: Context-Aware Smart Defaults

**Constraint:** Optimize for the most common case - minimal typing for daily
tasks

## Philosophy

- Smart defaults based on context (current directory, git branch)
- Commands adapt to what you're likely trying to do
- Progressive disclosure - simple by default, powerful when needed
- Inspired by: `vercel` CLI, `netlify` CLI, modern DX-first tools

---

### aamini status

**Client:** BOTH **Description:** Context-aware status display **Signature:**
`aamini status [what] [flags]`

**Smart Defaults:**

- In app directory → show that app's status
- At root → show summary of all apps
- On feature branch → compare to main

**Flags:** --app <name> Override context app --all Force all apps view --watch
Live updating dashboard --json CI output --deploy Focus on deployment status
--cache Focus on cache status **Examples:** $ aamini status # Context-aware
status $ aamini status --watch # Live dashboard $ aamini status deploy #
Deployment focus $ aamini status --app imdbgraph # Override context

---

### aamini logs

**Client:** BOTH **Description:** Stream logs with intelligent source detection
**Signature:** `aamini logs [source] [flags]`

**Smart Defaults:**

- Dev server running → stream dev logs
- Recent build → show build logs
- Nothing running → show last deployment logs

**Flags:** --app <name> Target app --env <env> Environment (auto-detected)
--follow, -f Stream new logs --lines, -n <n> Lines to show (default:
context-aware) --since <time> Start time --errors Errors only **Examples:** $
aamini logs # Smart source detection $ aamini logs -f # Follow mode $ aamini
logs build # Build logs $ aamini logs prod # Production logs $ aamini logs
--since 10m # Last 10 minutes

---

### aamini config

**Client:** BOTH **Description:** Unified config management with interactive
mode **Signature:** `aamini config [action] [flags]`

**Smart Defaults:**

- No action → interactive config explorer
- In app dir → app-specific config
- Global flag → global config

**Actions:** (all optional - interactive if omitted) get <key> Get value set
<key> <value> Set value list List all values edit Open in editor validate Check
config

**Flags:** --app <name> App context --global, -g Global config --json Machine
output --file <path> Specific file **Examples:** $ aamini config # Interactive
mode $ aamini config get turbo.cache $ aamini config set port 3000 -g $ aamini
config list --json

---

### aamini check

**Client:** BOTH **Description:** Quick health check with smart fixes
**Signature:** `aamini check [what] [flags]`

**Checks:** (runs all if not specified) deps Dependency check env Environment
variables build Build health deploy Deployment status git Git state

**Flags:** --fix Auto-fix issues --strict Fail on warnings --json CI output
**Examples:** $ aamini check # Full health check $ aamini check deps #
Dependencies only $ aamini check --fix # Fix what we can $ aamini check
--strict # CI mode

---

### aamini cache

**Client:** BOTH **Description:** Cache management with usage insights
**Signature:** `aamini cache [action] [flags]`

**Smart Defaults:**

- No action → show cache status/info

**Actions:** status Show cache info (default) clear Clear cache analyze Show
hit/miss analysis optimize Remove duplicates, compress

**Flags:** --app <name> App-specific --older-than <time> Time-based filter
--dry-run Preview changes --yes Skip confirmation **Examples:** $ aamini cache #
Show status $ aamini cache clear # Clear all $ aamini cache clear --older-than
7d $ aamini cache analyze # Efficiency report

---

### aamini open

**Client:** DEV **Description:** Open relevant URLs based on context
**Signature:** `aamini open [what] [flags]`

**Opens:** app Local dev server prod Production deployment staging Staging
deployment repo GitHub repo logs Log dashboard metrics Analytics/metrics

**Flags:** --app <name> Override context --browser <name> Specific browser
**Examples:** $ aamini open # Open local dev $ aamini open prod # Open
production $ aamini open repo # Open GitHub

---

### aamini switch

**Client:** DEV **Description:** Switch context (app, environment)
**Signature:** `aamini switch <target> [flags]`

**Targets:** app <name> Switch to app env <env> Switch environment context

**Flags:** --create Create if doesn't exist **Examples:** $ aamini switch app
imdbgraph # Switch context $ aamini switch env staging # Switch env context

---

## What This Design Hides

- Complex context detection logic
- Multiple config file formats
- Environment variable resolution
- Smart default algorithms

## Trade-offs

**Pros:**

- Zero-config for common cases
- Reduces typing for daily workflows
- Feels magical when it works
- Progressive complexity

**Cons:**

- Magic can be confusing when wrong
- Harder to debug
- Behavior varies by directory
- Documentation needs to explain context rules
- May frustrate users who want explicit control
