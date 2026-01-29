# Bun Environment Variable Loading Order

## **Loading Priority (Highest to Lowest):**

1. **`.env.local`** - Local overrides (highest priority)
2. **`.env.[NODE_ENV]`** - Environment-specific (e.g., `.env.production`, `.env.development`)
3. **`.env`** - Default environment variables (lowest priority)

## **Files Created for Tier-1380 OMEGA:**

### **1. `.env.local`** (Highest Priority)
```bash
# Environment variables for Bun configuration
# Bun automatically loads environment variables from .env.local, .env.[NODE_ENV], and .env

# Loading order (highest to lowest priority):
# 1. .env.local
# 2. .env.[NODE_ENV] (e.g., .env.production, .env.development)
# 3. .env

# Default npm registry
BUN_CONFIG_REGISTRY=https://registry.npmjs.org

# Optional: Private registry token
# npm_token=your-auth-token-here

# Link native binaries for performance
BUN_CONFIG_LINK_NATIVE_BINS=true
```

### **2. `.env.development`** (Development Environment)
```bash
# Environment variables for development environment
# This file is loaded when NODE_ENV=development

# Default npm registry
BUN_CONFIG_REGISTRY=https://registry.npmjs.org

# Development-specific settings
BUN_CONFIG_LINK_NATIVE_BINS=true
BUN_CONFIG_SKIP_SAVE_LOCKFILE=false
BUN_CONFIG_SKIP_LOAD_LOCKFILE=false
```

### **3. `.env.production`** (Production Environment)
```bash
# Environment variables for production environment
# This file is loaded when NODE_ENV=production

# Default npm registry
BUN_CONFIG_REGISTRY=https://registry.npmjs.org

# Production-specific settings
BUN_CONFIG_LINK_NATIVE_BINS=true
BUN_CONFIG_SKIP_SAVE_LOCKFILE=true
BUN_CONFIG_SKIP_LOAD_LOCKFILE=true
```

### **4. `.env`** (Default/Fallback)
```bash
# Environment variables for Bun configuration
# Bun automatically loads these from .env.local, .env.[NODE_ENV], and .env

# Default npm registry
BUN_CONFIG_REGISTRY=https://registry.npmjs.org

# Link native binaries for performance
BUN_CONFIG_LINK_NATIVE_BINS=true
```

## **Usage Examples:**

### **Development Mode:**
```bash
NODE_ENV=development bun install
# Loads: .env.local → .env.development → .env
```

### **Production Mode:**
```bash
NODE_ENV=production bun install
# Loads: .env.local → .env.production → .env
```

### **Default Mode:**
```bash
bun install
# Loads: .env.local → .env
```

## **Environment Variable Reference in bunfig.toml:**

```toml
[install]
# Set default registry as a string
registry = "https://registry.npmjs.org"

# Use environment variable for token
registry = { url = "https://registry.npmjs.org", token = "$npm_token" }
```

## **Key Benefits:**

1. **Environment-specific configurations** - Different settings for dev/prod
2. **Local overrides** - `.env.local` for development-specific changes
3. **Secure token management** - Environment variables for sensitive data
4. **Automatic loading** - Bun handles the loading order automatically

**The Tier-1380 OMEGA infrastructure now supports proper environment variable loading with full precedence control!** 🔥
