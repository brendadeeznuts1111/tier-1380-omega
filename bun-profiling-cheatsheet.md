# Bun v1.3.7 Profiling Cheatsheet
# Created: January 29, 2026 11:27 AM CST

## CPU Profiling

### Environment Setup
```bash
export BUN_OPTIONS="--cpu-prof --cpu-prof-dir=profiles"
mkdir -p profiles
```

### Generate Profiles
```bash
# Chrome DevTools format only
bun --cpu-prof script.js

# Markdown format only (LLM-friendly)
bun --cpu-prof-md script.js

# Both formats
bun --cpu-prof --cpu-prof-md script.js

# Custom output location
bun --cpu-prof --cpu-prof-dir ./profiles --cpu-prof-name my-profile script.js
```

### Profile Analysis
```bash
# Find hot functions in markdown profile
grep "fibonacci" profiles/CPU.*.md

# Search for functions with high self-time
grep "^[0-9]\+\.[0-9]\%" profiles/CPU.*.md | head -10

# Find specific function locations
grep "fibonacci.*js:" profiles/CPU.*.md
```

## Heap Profiling

### Generate Heap Snapshots
```bash
# Chrome DevTools format (.heapsnapshot)
bun --heap-prof script.js

# Markdown format (CLI-friendly)
bun --heap-prof-md script.js

# Custom output
bun --heap-prof --heap-prof-dir ./profiles --heap-prof-name snapshot.heapsnapshot script.js
```

### Heap Analysis Commands
```bash
# Find all Function objects
grep '| `Function`' profiles/Heap.*.md

# Find objects >= 10KB
grep 'size=[0-9]\{5,\}' profiles/Heap.*.md

# Find all GC roots
grep 'gcroot=1' profiles/Heap.*.md

# Find specific object by ID
grep '| 12345 |' profiles/Heap.*.md
```

## Profile Output Examples

### CPU Profile Summary
- Duration: 127.9ms
- Samples: 95
- Functions: 26
- Hot function: `fibonacci` (62.9% self-time)

### Heap Profile Summary  
- Total Heap Size: 246.1 KB
- Total Objects: 3,656
- Unique Types: 71
- GC Roots: 1,420

## Integration with One-Liner Arsenal

Add profiling to any one-liner:
```bash
BUN_OPTIONS="--cpu-prof --cpu-prof-dir=profiles" bun -e "console.time('color'); for(let i=0;i<1e6;i++) Bun.color('#6366f1'); console.timeEnd('color')"
```
