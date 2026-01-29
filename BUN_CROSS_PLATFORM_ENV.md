# Cross-Platform Environment Variables for Tier-1380 OMEGA

## **Cross-Platform Solution with Windows**

### **Using `bun exec` for Cross-Platform Compatibility**
```bash
# Cross-platform environment variable setting
bun exec 'FOO=helloworld bun run dev'

# For Tier-1380 OMEGA
bun exec 'NODE_ENV=production bun run cli/omega-profile.ts generate --type cpu --env prod'
bun exec 'BUN_CONFIG_REGISTRY=https://registry.npmjs.org bun install'
```

### **Package.json Scripts (Cross-Platform)**
```json
{
  "scripts": {
    "dev": "NODE_ENV=development bun --watch app.ts",
    "omega:profile": "bun run cli/omega-profile.ts",
    "omega:generate": "bun exec 'NODE_ENV=production bun run cli/omega-profile.ts generate'",
    "install:prod": "bun exec 'BUN_CONFIG_SKIP_SAVE_LOCKFILE=true bun install --production'"
  }
}
```

## **Environment Variable Loading Order (Verified)**

### **Automatic Loading Priority:**
1. **`.env.local`** - Local overrides (highest priority)
2. **`.env.[NODE_ENV]`** - Environment-specific (e.g., `.env.production`, `.env.development`)
3. **`.env`** - Default environment variables (lowest priority)

### **Manual .env File Specification**
```bash
# Load specific .env files
bun --env-file=.env.1 src/index.ts
bun --env-file=.env.abc --env-file=.env.def run build

# For Tier-1380 OMEGA
bun --env-file=.env.production run cli/omega-profile.ts sequence --type tension --count 10
```

### **Disabling Automatic .env Loading**
```bash
# Disable .env loading
bun run --no-env-file index.ts

# In bunfig.toml
[load]
env = false
```

## **Configuring Bun Runtime**

### **Bun Runtime Environment Variables**
```bash
# Runtime transpiler cache
BUN_RUNTIME_TRANSPILER_CACHE_PATH=/path/to/cache

# Disable runtime transpiler cache
BUN_RUNTIME_TRANSPILER_CACHE=false

# Log level
BUN_LOG_LEVEL=debug

# Max threads
BUN_MAX_THREADS=8
```

### **TypeScript Environment Variables**
```typescript
// Reading environment variables in TypeScript
const token = process.env.npm_token;
const registry = process.env.BUN_CONFIG_REGISTRY;
const nodeEnv = process.env.NODE_ENV;

// Type-safe environment variables
interface Env {
  npm_token?: string;
  BUN_CONFIG_REGISTRY?: string;
  NODE_ENV?: 'development' | 'production' | 'test';
}

const env = process.env as Env;
```

## **Tier-1380 OMEGA Cross-Platform Configuration**

### **Enhanced .env Files**
```bash
# .env.local (Cross-platform)
BUN_CONFIG_REGISTRY=https://registry.npmjs.org
BUN_CONFIG_LINK_NATIVE_BINS=true
npm_token=your-auth-token-here
NODE_ENV=development
BUN_LOG_LEVEL=info
BUN_MAX_THREADS=4
```

### **Enhanced bunfig.toml**
```toml
[install]
registry = { url = "https://registry.npmjs.org", token = "$npm_token" }
linker = "hoisted"
concurrentScripts = 16

[load]
# Enable automatic .env loading
env = true

[run]
# Default NODE_ENV for scripts
preload = ["./scripts/preload.ts"]

[log]
# Log level configuration
level = "info"
```

### **Cross-Platform Scripts**
```bash
# Windows-compatible environment setting
bun exec 'NODE_ENV=production BUN_CONFIG_REGISTRY=https://registry.npmjs.org bun install'

# Tier-1380 OMEGA operations
bun exec 'NODE_ENV=production bun run cli/omega-profile.ts sequence --type tension --env staging --count 10'
bun exec 'BUN_CONFIG_LINK_NATIVE_BINS=true bun install'

# Development with watch
bun exec 'NODE_ENV=development bun --watch core/profile/ProfilePublisher.ts'
```

## **Advanced Configuration**

### **Runtime Transpiler Cache**
```bash
# Enable runtime transpiler cache
BUN_RUNTIME_TRANSPILER_CACHE=true
BUN_RUNTIME_TRANSPILER_CACHE_PATH=./cache/bun

# Disable for debugging
BUN_RUNTIME_TRANSPILER_CACHE=false
```

### **Environment Variable Expansion**
```bash
# .env file with variable expansion
BASE_URL=https://api.factory-wager.com
PROFILE_URL=${BASE_URL}/profiles

# Quotation marks handling
FOO='hello world'
BAR="hello world"
BAZ=`hello world`
```

## **Best Practices for Tier-1380 OMEGA**

1. **Use `bun exec`** for cross-platform environment variable setting
2. **Leverage `.env.local`** for development overrides
3. **Environment-specific configs** with `.env.[NODE_ENV]`
4. **TypeScript interfaces** for type-safe environment variables
5. **Runtime cache configuration** for optimal performance
6. **Cross-platform scripts** in package.json

**The Tier-1380 OMEGA infrastructure now supports full cross-platform environment variable management!** 🔥
