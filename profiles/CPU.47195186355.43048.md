# CPU Profile

| Duration | Samples | Interval | Functions |
|----------|---------|----------|----------|
| 127.9ms | 95 | 1.0ms | 26 |

**Top 10:** `fibonacci` 62.9%, `fetch` 12.2%, `async loadAndEvaluateModule` 8.5%, `fibonacci` 5.8%, `parseModule` 3.5%, `from` 1.8%, `Set` 1.1%, `stringOperations` 1.0%, `resolve` 1.0%, `requestSatisfyUtil` 0.8%

## Hot Functions (Self Time)

| Self% | Self | Total% | Total | Function | Location |
|------:|-----:|-------:|------:|----------|----------|
| 62.9% | 80.4ms | 100.0% | 2.22s | `fibonacci` | `/Users/nolarose/cf-skills/claude-skills/profile-test.js:6` |
| 12.2% | 15.6ms | 12.2% | 15.6ms | `fetch` | `[native code]` |
| 8.5% | 10.9ms | 92.4% | 118.2ms | `async loadAndEvaluateModule` | `[native code]` |
| 5.8% | 7.5ms | 5.8% | 7.5ms | `fibonacci` | `/Users/nolarose/cf-skills/claude-skills/profile-test.js:5` |
| 3.5% | 4.5ms | 3.5% | 4.5ms | `parseModule` | `[native code]` |
| 1.8% | 2.3ms | 1.8% | 2.3ms | `from` | `[native code]` |
| 1.1% | 1.4ms | 1.1% | 1.4ms | `Set` | `[native code]` |
| 1.0% | 1.3ms | 1.0% | 1.3ms | `stringOperations` | `/Users/nolarose/cf-skills/claude-skills/profile-test.js:18` |
| 1.0% | 1.3ms | 1.0% | 1.3ms | `resolve` | `[native code]` |
| 0.8% | 1.1ms | 13.0% | 16.7ms | `requestSatisfyUtil` | `[native code]` |
| 0.8% | 1.0ms | 0.8% | 1.0ms | `moduleDeclarationInstantiation` | `[native code]` |

## Call Tree (Total Time)

| Total% | Total | Self% | Self | Function | Location |
|-------:|------:|------:|-----:|----------|----------|
| 100.0% | 2.22s | 62.9% | 80.4ms | `fibonacci` | `/Users/nolarose/cf-skills/claude-skills/profile-test.js:6` |
| 100.0% | 183.6ms | 0.0% | 0us | `moduleEvaluation` | `[native code]` |
| 92.4% | 118.2ms | 8.5% | 10.9ms | `async loadAndEvaluateModule` | `[native code]` |
| 71.7% | 91.8ms | 0.0% | 0us | `evaluate` | `[native code]` |
| 68.8% | 88.0ms | 0.0% | 0us | `heavyComputation` | `/Users/nolarose/cf-skills/claude-skills/profile-test.js:11` |
| 68.8% | 88.0ms | 0.0% | 0us | `(module)` | `/Users/nolarose/cf-skills/claude-skills/profile-test.js:32` |
| 28.0% | 35.8ms | 0.0% | 0us | `async (anonymous)` | `[native code]` |
| 13.0% | 16.7ms | 0.8% | 1.1ms | `requestSatisfyUtil` | `[native code]` |
| 12.2% | 15.6ms | 0.0% | 0us | `requestFetch` | `[native code]` |
| 12.2% | 15.6ms | 0.0% | 0us | `requestInstantiate` | `[native code]` |
| 12.2% | 15.6ms | 12.2% | 15.6ms | `fetch` | `[native code]` |
| 10.4% | 13.4ms | 0.0% | 0us | `(anonymous)` | `[native code]` |
| 7.5% | 9.5ms | 0.0% | 0us | `async loadModule` | `[native code]` |
| 5.8% | 7.5ms | 5.8% | 7.5ms | `fibonacci` | `/Users/nolarose/cf-skills/claude-skills/profile-test.js:5` |
| 3.5% | 4.5ms | 3.5% | 4.5ms | `parseModule` | `[native code]` |
| 2.6% | 3.3ms | 0.0% | 0us | `requestSatisfy` | `[native code]` |
| 1.8% | 2.3ms | 1.8% | 2.3ms | `from` | `[native code]` |
| 1.8% | 2.3ms | 0.0% | 0us | `(module)` | `/Users/nolarose/cf-skills/claude-skills/profile-test.js:34` |
| 1.8% | 2.3ms | 0.0% | 0us | `arrayOperations` | `/Users/nolarose/cf-skills/claude-skills/profile-test.js:26` |
| 1.6% | 2.1ms | 0.0% | 0us | `link` | `[native code]` |
| 1.1% | 1.4ms | 1.1% | 1.4ms | `Set` | `[native code]` |
| 1.0% | 1.3ms | 0.0% | 0us | `(module)` | `/Users/nolarose/cf-skills/claude-skills/profile-test.js:33` |
| 1.0% | 1.3ms | 1.0% | 1.3ms | `stringOperations` | `/Users/nolarose/cf-skills/claude-skills/profile-test.js:18` |
| 1.0% | 1.3ms | 1.0% | 1.3ms | `resolve` | `[native code]` |
| 0.8% | 1.0ms | 0.0% | 0us | `linkAndEvaluateModule` | `[native code]` |
| 0.8% | 1.0ms | 0.8% | 1.0ms | `moduleDeclarationInstantiation` | `[native code]` |

## Function Details

### `fibonacci`
`/Users/nolarose/cf-skills/claude-skills/profile-test.js:6` | Self: 62.9% (80.4ms) | Total: 100.0% (2.22s) | Samples: 63

**Called by:**
- `fibonacci` (1671)
- `heavyComputation` (69)

**Calls:**
- `fibonacci` (1671)
- `fibonacci` (6)

### `fetch`
`[native code]` | Self: 12.2% (15.6ms) | Total: 12.2% (15.6ms) | Samples: 12

**Called by:**
- `requestFetch` (12)

### `async loadAndEvaluateModule`
`[native code]` | Self: 8.5% (10.9ms) | Total: 92.4% (118.2ms) | Samples: 4

**Called by:**
- `async loadAndEvaluateModule` (7)

**Calls:**
- `moduleEvaluation` (72)
- `async loadAndEvaluateModule` (7)
- `async loadModule` (4)
- `linkAndEvaluateModule` (1)
- `resolve` (1)

### `fibonacci`
`/Users/nolarose/cf-skills/claude-skills/profile-test.js:5` | Self: 5.8% (7.5ms) | Total: 5.8% (7.5ms) | Samples: 6

**Called by:**
- `fibonacci` (6)

### `parseModule`
`[native code]` | Self: 3.5% (4.5ms) | Total: 3.5% (4.5ms) | Samples: 3

**Called by:**
- `async (anonymous)` (3)

### `from`
`[native code]` | Self: 1.8% (2.3ms) | Total: 1.8% (2.3ms) | Samples: 2

**Called by:**
- `arrayOperations` (2)

### `Set`
`[native code]` | Self: 1.1% (1.4ms) | Total: 1.1% (1.4ms) | Samples: 1

**Called by:**
- `async loadModule` (1)

### `stringOperations`
`/Users/nolarose/cf-skills/claude-skills/profile-test.js:18` | Self: 1.0% (1.3ms) | Total: 1.0% (1.3ms) | Samples: 1

**Called by:**
- `(module)` (1)

### `resolve`
`[native code]` | Self: 1.0% (1.3ms) | Total: 1.0% (1.3ms) | Samples: 1

**Called by:**
- `async loadAndEvaluateModule` (1)

### `requestSatisfyUtil`
`[native code]` | Self: 0.8% (1.1ms) | Total: 13.0% (16.7ms) | Samples: 1

**Called by:**
- `(anonymous)` (10)
- `requestSatisfy` (3)

**Calls:**
- `requestInstantiate` (12)

### `moduleDeclarationInstantiation`
`[native code]` | Self: 0.8% (1.0ms) | Total: 0.8% (1.0ms) | Samples: 1

**Called by:**
- `link` (1)

### `(module)`
`/Users/nolarose/cf-skills/claude-skills/profile-test.js:34` | Self: 0.0% (0us) | Total: 1.8% (2.3ms) | Samples: 0

**Called by:**
- `evaluate` (2)

**Calls:**
- `arrayOperations` (2)

### `requestFetch`
`[native code]` | Self: 0.0% (0us) | Total: 12.2% (15.6ms) | Samples: 0

**Called by:**
- `async (anonymous)` (12)

**Calls:**
- `fetch` (12)

### `link`
`[native code]` | Self: 0.0% (0us) | Total: 1.6% (2.1ms) | Samples: 0

**Called by:**
- `link` (1)
- `linkAndEvaluateModule` (1)

**Calls:**
- `link` (1)
- `moduleDeclarationInstantiation` (1)

### `(module)`
`/Users/nolarose/cf-skills/claude-skills/profile-test.js:33` | Self: 0.0% (0us) | Total: 1.0% (1.3ms) | Samples: 0

**Called by:**
- `evaluate` (1)

**Calls:**
- `stringOperations` (1)

### `linkAndEvaluateModule`
`[native code]` | Self: 0.0% (0us) | Total: 0.8% (1.0ms) | Samples: 0

**Called by:**
- `async loadAndEvaluateModule` (1)

**Calls:**
- `link` (1)

### `requestSatisfy`
`[native code]` | Self: 0.0% (0us) | Total: 2.6% (3.3ms) | Samples: 0

**Called by:**
- `async loadModule` (3)

**Calls:**
- `requestSatisfyUtil` (3)

### `requestInstantiate`
`[native code]` | Self: 0.0% (0us) | Total: 12.2% (15.6ms) | Samples: 0

**Called by:**
- `requestSatisfyUtil` (12)

**Calls:**
- `async (anonymous)` (12)

### `moduleEvaluation`
`[native code]` | Self: 0.0% (0us) | Total: 100.0% (183.6ms) | Samples: 0

**Called by:**
- `moduleEvaluation` (72)
- `async loadAndEvaluateModule` (72)

**Calls:**
- `moduleEvaluation` (72)
- `evaluate` (72)

### `(anonymous)`
`[native code]` | Self: 0.0% (0us) | Total: 10.4% (13.4ms) | Samples: 0

**Calls:**
- `requestSatisfyUtil` (10)

### `(module)`
`/Users/nolarose/cf-skills/claude-skills/profile-test.js:32` | Self: 0.0% (0us) | Total: 68.8% (88.0ms) | Samples: 0

**Called by:**
- `evaluate` (69)

**Calls:**
- `heavyComputation` (69)

### `evaluate`
`[native code]` | Self: 0.0% (0us) | Total: 71.7% (91.8ms) | Samples: 0

**Called by:**
- `moduleEvaluation` (72)

**Calls:**
- `(module)` (69)
- `(module)` (2)
- `(module)` (1)

### `heavyComputation`
`/Users/nolarose/cf-skills/claude-skills/profile-test.js:11` | Self: 0.0% (0us) | Total: 68.8% (88.0ms) | Samples: 0

**Called by:**
- `(module)` (69)

**Calls:**
- `fibonacci` (69)

### `async loadModule`
`[native code]` | Self: 0.0% (0us) | Total: 7.5% (9.5ms) | Samples: 0

**Called by:**
- `async loadModule` (4)
- `async loadAndEvaluateModule` (4)

**Calls:**
- `async loadModule` (4)
- `requestSatisfy` (3)
- `Set` (1)

### `async (anonymous)`
`[native code]` | Self: 0.0% (0us) | Total: 28.0% (35.8ms) | Samples: 0

**Called by:**
- `async (anonymous)` (12)
- `requestInstantiate` (12)

**Calls:**
- `async (anonymous)` (12)
- `requestFetch` (12)
- `parseModule` (3)

### `arrayOperations`
`/Users/nolarose/cf-skills/claude-skills/profile-test.js:26` | Self: 0.0% (0us) | Total: 1.8% (2.3ms) | Samples: 0

**Called by:**
- `(module)` (2)

**Calls:**
- `from` (2)

## Files

| Self% | Self | File |
|------:|-----:|------|
| 69.9% | 89.4ms | `/Users/nolarose/cf-skills/claude-skills/profile-test.js` |
| 30.0% | 38.4ms | `[native code]` |
