# Design 1: Minimalist Unix-Style

**Constraint:** Minimize command count - aim for 1-3 primary commands max, heavy
use of flags/subcommands

## Philosophy

- Fewer commands, more flags
- Unix philosophy: do one thing well
- Compose via flags rather than separate commands
- Inspired by: `git`, `kubectl`, `systemctl`

---

### aamini status

**Client:** BOTH **Description:** Show comprehensive repo status - git state,
turbo cache, build outputs, deployments **Signature:**
`aamini status [app...] [flags]` **Flags:** -a, --all Show all apps (default:
current app only) -w, --watch Watch mode - refresh every 5s -j, --json Output as
JSON for CI parsing -v, --verbose Show detailed info (deps, env vars) --cache
Show turbo cache status only --deploy Show deployment status only --git Show git
status only **Examples:** $ aamini status # Status of current app $ aamini
status imdbgraph # Status of specific app $ aamini status --all # Status of all
apps $ aamini status --json # CI-friendly JSON output $ aamini status --watch #
Live dashboard

---

### aamini logs

**Client:** BOTH **Description:** Stream logs from apps, builds, or deployments
**Signature:** `aamini logs [source] [flags]` **Flags:** -a, --app <name> Target
app (default: current) -e, --env <env> Environment: local|staging|prod (default:
local) -f, --follow Follow/tail mode (stream new logs) -n, --lines <n> Number of
lines to show (default: 50) -s, --since <time> Show logs since (e.g., "1h",
"30m") --build Show build logs --runtime Show runtime/app logs --errors-only
Filter to errors only --json Structured JSON output **Examples:** $ aamini
logs # Current app runtime logs $ aamini logs --app imdbgraph --follow $ aamini
logs --env prod --since 1h $ aamini logs --build --app portfolio

---

### aamini config

**Client:** BOTH **Description:** Manage CLI and app configuration
**Signature:** `aamini config <action> [key] [value] [flags]` **Actions:** get,
set, list, edit, validate **Flags:** -a, --app <name> Target app (default:
global) -g, --global Use global config --json Output as JSON --file <path> Use
specific config file **Examples:** $ aamini config list # List all config values
$ aamini config get turbo.cache # Get specific value $ aamini config set
turbo.cache.enabled true --app imdbgraph $ aamini config edit # Open in $EDITOR
$
aamini config validate # Check config for errors

---

### aamini doctor

**Client:** BOTH **Description:** Diagnose common issues - check versions, env,
dependencies **Signature:** `aamini doctor [flags]` **Flags:** -f, --fix
Auto-fix issues where possible -v, --verbose Show all checks, even passing
--json Output as JSON **Examples:** $ aamini doctor # Run all diagnostics $
aamini doctor --fix # Fix auto-fixable issues $ aamini doctor --verbose # Show
everything

---

### aamini cache

**Client:** BOTH **Description:** Manage turbo cache - view, clear, analyze
**Signature:** `aamini cache <action> [flags]` **Actions:** status, clear,
analyze, prune **Flags:** -a, --app <name> Target app (default: all) --dry-run
Show what would be done --older-than <time> Clear cache older than (e.g., "7d")
**Examples:** $ aamini cache status # Show cache size/hits $ aamini cache
clear # Clear all cache $ aamini cache clear --older-than 7d $ aamini cache
analyze # Show cache efficiency

---

## What This Design Hides

- All complexity of turbo cache internals
- Git command composition
- Log aggregation from multiple sources
- Config file format details

## Trade-offs

**Pros:**

- Very few commands to learn
- Consistent flag patterns
- Easy to script for CI
- Composable via flags

**Cons:**

- Commands have many flags (can be overwhelming)
- Less discoverable than explicit commands
- Some flag combinations may not make sense
- Longer command lines
