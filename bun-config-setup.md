# Bun Configuration with Environment Variables

## Key Environment Variables

Based on the Bun documentation, here are the main environment variables for configuring Bun:

### Registry Configuration
```bash
# Set custom npm registry
export BUN_CONFIG_REGISTRY="https://registry.npmjs.org"

# Set authentication token for private registries
export BUN_CONFIG_TOKEN="your-auth-token-here"
```

### Lockfile Configuration  
```bash
# Skip saving lockfile (equivalent to --no-save-lockfile)
export BUN_CONFIG_SKIP_SAVE_LOCKFILE=true

# Skip loading lockfile (equivalent to --no-lockfile)
export BUN_CONFIG_SKIP_LOAD_LOCKFILE=true
```

### Installation Behavior
```bash
# Skip installing packages (use with cache)
export BUN_CONFIG_SKIP_INSTALL_PACKAGES=true

# Configure native binary linking
export BUN_CONFIG_LINK_NATIVE_BINS=true
```

### Yarn Compatibility
```bash
# Use yarn.lock file
export BUN_CONFIG_YARN_LOCKFILE=true
```

## Setup for Tier-1380 OMEGA Project

For our OMEGA infrastructure, let's configure Bun for optimal performance:

```bash
# Set up environment for development
export BUN_CONFIG_REGISTRY="https://registry.npmjs.org"
export BUN_CONFIG_LINK_NATIVE_BINS=true
export BUN_CONFIG_SKIP_SAVE_LOCKFILE=false
export BUN_CONFIG_SKIP_LOAD_LOCKFILE=false
```

## bunfig.toml Alternative

You can also use a `bunfig.toml` file instead of environment variables:

```toml
[install]
# Install optional dependencies
optional = true
# Install dev dependencies  
dev = true
# Install peer dependencies
peer = true
# Production mode (no dev deps)
production = false
# Save text lockfile
saveTextLockfile = false
# Frozen lockfile mode
frozenLockfile = false
# Dry run mode
dryRun = false
# Concurrent scripts (cpu count * 2)
concurrentScripts = 16
# Installation strategy: "hoisted" or "isolated"
linker = "hoisted"
# Minimum release age (3 days in seconds)
minimumReleaseAge = 259200
# Exclude packages from minimum age check
minimumReleaseAgeExcludes = ["@types/node", "typescript"]
```

## Usage Examples

```bash
# Install with environment variables
BUN_CONFIG_REGISTRY="https://registry.npmjs.org" bun install

# Install in production mode
BUN_CONFIG_SKIP_SAVE_LOCKFILE=true bun install --production

# Use with custom registry
BUN_CONFIG_REGISTRY="https://your-private-registry.com" BUN_CONFIG_TOKEN="your-token" bun install
```
