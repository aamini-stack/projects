# Design 2: Verb-Noun Explicit Style

**Constraint:** Maximize clarity - explicit command names, minimal flags

## Philosophy
- Many explicit commands, fewer flags
- Commands read like English sentences
- Self-documenting through clear naming
- Inspired by: `gh` (GitHub CLI), `vercel` CLI, `flyctl`

---

### aamini status
**Client:** BOTH
**Description:** Show current working state of repo
**Signature:** `aamini status [flags]`
**Flags:**
  --json                 Machine-readable output
**Examples:**
  $ aamini status
  $ aamini status --json

---

### aamini status app
**Client:** BOTH
**Description:** Show status of specific app(s)
**Signature:** `aamini status app [app-name] [flags]`
**Flags:**
  --all                  Show all apps
  --json                 Machine-readable output
**Examples:**
  $ aamini status app                  # Current app
  $ aamini status app imdbgraph        # Specific app
  $ aamini status app --all            # All apps

---

### aamini status deploy
**Client:** BOTH
**Description:** Show deployment status
**Signature:** `aamini status deploy [app-name] [flags]`
**Flags:**
  --env <env>            Environment: staging|prod
  --json                 Machine-readable output
**Examples:**
  $ aamini status deploy imdbgraph --env prod

---

### aamini logs
**Client:** BOTH
**Description:** Show recent logs
**Signature:** `aamini logs [flags]`
**Flags:**
  --lines <n>            Number of lines (default: 50)
  --json                 Structured output
**Examples:**
  $ aamini logs --lines 100

---

### aamini logs tail
**Client:** DEV
**Description:** Stream logs in real-time
**Signature:** `aamini logs tail [app-name] [flags]`
**Flags:**
  --env <env>            Environment: local|staging|prod
  --errors               Show errors only
**Examples:**
  $ aamini logs tail                   # Current app
  $ aamini logs tail imdbgraph         # Specific app
  $ aamini logs tail --env prod

---

### aamini logs build
**Client:** BOTH
**Description:** Show build logs
**Signature:** `aamini logs build [app-name] [flags]`
**Flags:**
  --last                 Show last build only
  --failed               Show failed builds only
**Examples:**
  $ aamini logs build imdbgraph --last

---

### aamini config show
**Client:** BOTH
**Description:** Display current configuration
**Signature:** `aamini config show [flags]`
**Flags:**
  --app <name>           Show app-specific config
  --json                 Output as JSON
**Examples:**
  $ aamini config show
  $ aamini config show --app imdbgraph

---

### aamini config get
**Client:** BOTH
**Description:** Get specific config value
**Signature:** `aamini config get <key> [flags]`
**Flags:**
  --app <name>           Get from app config
**Examples:**
  $ aamini config get turbo.cache.enabled
  $ aamini config get build.output --app portfolio

---

### aamini config set
**Client:** DEV
**Description:** Set config value
**Signature:** `aamini config set <key> <value> [flags]`
**Flags:**
  --app <name>           Set in app config
  --global               Set in global config
**Examples:**
  $ aamini config set default.app imdbgraph
  $ aamini config set build.parallel 4 --global

---

### aamini config edit
**Client:** DEV
**Description:** Open config in editor
**Signature:** `aamini config edit [flags]`
**Flags:**
  --app <name>           Edit app config
  --global               Edit global config
**Examples:**
  $ aamini config edit
  $ aamini config edit --app imdbgraph

---

### aamini config validate
**Client:** BOTH
**Description:** Validate configuration files
**Signature:** `aamini config validate [flags]`
**Flags:**
  --app <name>           Validate specific app
  --strict               Fail on warnings
**Examples:**
  $ aamini config validate
  $ aamini config validate --app imdbgraph --strict

---

### aamini cache info
**Client:** BOTH
**Description:** Show cache statistics
**Signature:** `aamini cache info [flags]`
**Flags:**
  --app <name>           Show for specific app
  --json                 Output as JSON
**Examples:**
  $ aamini cache info
  $ aamini cache info --app imdbgraph

---

### aamini cache clear
**Client:** BOTH
**Description:** Clear build cache
**Signature:** `aamini cache clear [flags]`
**Flags:**
  --app <name>           Clear for specific app
  --older-than <time>    Clear old entries only
  --yes                  Skip confirmation
**Examples:**
  $ aamini cache clear
  $ aamini cache clear --app imdbgraph --older-than 7d

---

### aamini doctor
**Client:** BOTH
**Description:** Run diagnostics
**Signature:** `aamini doctor [flags]`
**Flags:**
  --fix                  Auto-fix issues
  --verbose              Show all checks
**Examples:**
  $ aamini doctor
  $ aamini doctor --fix

---

### aamini version
**Client:** BOTH
**Description:** Show CLI version
**Signature:** `aamini version [flags]`
**Flags:**
  --check                Check for updates
**Examples:**
  $ aamini version
  $ aamini version --check

---

## What This Design Hides
- Flag parsing complexity (more commands = simpler flags)
- Internal routing logic
- Config file locations

## Trade-offs
**Pros:**
- Very discoverable - commands are self-documenting
- Each command does one specific thing
- Easy to autocomplete
- Clear intent from command name

**Cons:**
- Many commands to learn
- Longer command chains
- More code to maintain
- May feel verbose for power users
