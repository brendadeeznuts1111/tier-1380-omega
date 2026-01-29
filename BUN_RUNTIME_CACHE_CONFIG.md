# Bun Runtime Transpiler Cache Configuration for Tier-1380 OMEGA

## **Runtime Transpiler Cache Overview**

Bun automatically caches transpiled output for source files larger than 50 KB to improve performance.

### **What Gets Cached:**
- Transpiled output of source files larger than 50 KB
- Sourcemaps for the transpiled output
- Stored in `.pile` files

## **Environment Variables**

### **`BUN_RUNTIME_TRANSPILER_CACHE_PATH`**

#### **Enable Custom Cache Path:**
```bash
# Set custom cache directory
BUN_RUNTIME_TRANSPILER_CACHE_PATH=./cache/bun

# Use with Tier-1380 OMEGA
BUN_RUNTIME_TRANSPILER_CACHE_PATH=./cache/bun bun run cli/omega-profile.ts generate --type cpu --env prod
```

#### **Disable Runtime Transpiler Cache:**
```bash
# Disable caching (set to "0")
BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 bun run dev

# Use with debugging
BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 bun --watch core/profile/ProfilePublisher.ts
```

#### **Default Behavior:**
- If not set, uses system temp directory (`TMPDIR` or `/tmp`)
- Automatically manages cache size and cleanup
- Persists across process restarts

## **Tier-1380 OMEGA Configuration**

### **Development Environment (.env.local):**
```bash
# Runtime transpiler cache configuration
BUN_RUNTIME_TRANSPILER_CACHE_PATH=./cache/bun

# Additional performance settings
BUN_CONFIG_LINK_NATIVE_BINS=true
BUN_CONFIG_MAX_HTTP_REQUESTS=256
BUN_LOG_LEVEL=info
```

### **Production Environment (.env.production):**
```bash
# Production cache settings
BUN_RUNTIME_TRANSPILER_CACHE_PATH=/tmp/bun-cache

# Performance optimizations
BUN_CONFIG_LINK_NATIVE_BINS=true
BUN_CONFIG_MAX_HTTP_REQUESTS=512
NO_COLOR=1
```

### **CI/CD Environment:**
```bash
# Disable cache in CI for clean builds
BUN_RUNTIME_TRANSPILER_CACHE_PATH=0

# CI-specific settings
BUN_CONFIG_SKIP_SAVE_LOCKFILE=true
BUN_CONFIG_SKIP_LOAD_LOCKFILE=true
```

## **Cache Management**

### **Cache Directory Structure:**
```
cache/bun/
├── .pile/           # Transpiler cache files
├── transpiled/      # Transpiled output
└── sourcemaps/      # Generated sourcemaps
```

### **Cache Benefits:**
- **Faster startup** - Skip transpilation for cached files
- **Improved development** - Quicker file watching
- **Better performance** - Reduced CPU usage for large files
- **Sourcemap support** - Debugging with cached sourcemaps

### **Cache Considerations:**
- **File size threshold** - Only caches files > 50 KB
- **Memory usage** - Cache consumes disk space
- **Stale cache** - May need cleanup for file changes
- **CI environments** - Often disabled for consistency

## **Usage Examples**

### **Development with Cache:**
```bash
# Enable custom cache path
export BUN_RUNTIME_TRANSPILER_CACHE_PATH=./cache/bun

# Run OMEGA CLI with caching
bun run cli/omega-profile.ts sequence --type tension --count 10

# Development with watch
bun --watch core/profile/ProfilePublisher.ts
```

### **Production Deployment:**
```bash
# Production cache settings
export BUN_RUNTIME_TRANSPILER_CACHE_PATH=/tmp/bun-cache

# Generate production profiles
NODE_ENV=production bun run cli/omega-profile.ts generate --type cpu --env prod
```

### **Debugging with Disabled Cache:**
```bash
# Disable cache for debugging
export BUN_RUNTIME_TRANSPILER_CACHE_PATH=0

# Debug OMEGA pipeline
bun run core/pipeline/DataFlowPipeline.ts
```

### **Cross-Platform Cache Setting:**
```bash
# Cross-platform cache configuration
bun exec 'BUN_RUNTIME_TRANSPILER_CACHE_PATH=./cache/bun bun run cli/omega-profile.ts'

# Windows-compatible
bun exec 'BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 bun --watch app.ts'
```

## **Performance Monitoring**

### **Cache Hit Monitoring:**
```bash
# Enable verbose logging to see cache activity
BUN_LOG_LEVEL=debug bun run cli/omega-profile.ts

# Monitor cache directory
ls -la cache/bun/.pile/
```

### **Cache Size Management:**
```bash
# Check cache size
du -sh cache/bun/

# Clean cache if needed
rm -rf cache/bun/.pile/
```

## **Best Practices for Tier-1380 OMEGA**

1. **Development** - Use custom cache path for persistence
2. **Production** - Use system temp directory for isolation
3. **CI/CD** - Disable cache for clean builds
4. **Debugging** - Disable cache to troubleshoot issues
5. **Cross-platform** - Use `bun exec` for Windows compatibility

**The Tier-1380 OMEGA infrastructure now has optimized runtime transpiler cache configuration for maximum performance!** 🔥
