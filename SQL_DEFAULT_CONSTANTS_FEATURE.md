# Tier-1380 OMEGA SQL Helper with DEFAULT Constants

## **🔥 Enhanced with DEFAULT Value Constants**

The SQL Helper now includes DEFAULT constants for better type safety and consistency when working with database DEFAULT values in the Tier-1380 OMEGA infrastructure.

## **📋 DEFAULT Constants**

### **Symbol for Explicit DEFAULT**
```typescript
export const DEFAULT = Symbol('DEFAULT');
```

### **Predefined DEFAULT Values**
```typescript
export const DEFAULT_VALUES = {
  TEAM: 'unassigned',
  BENCHMARK: 'baseline',
  TIER: '1380',
  ENVIRONMENT: 'unknown',
  CREATED_AT: 'CURRENT_TIMESTAMP',
  UPDATED_AT: 'CURRENT_TIMESTAMP',
  ACTIVE: true,
  SCORE: 0,
  STATUS: 'pending',
  PRIORITY: 'medium'
} as const;
```

### **Type Support**
```typescript
export type DefaultValue = typeof DEFAULT | typeof DEFAULT_VALUES[keyof typeof DEFAULT_VALUES];
```

## **🎯 Usage Examples**

### **Using DEFAULT Symbol**
```typescript
import { sql, DEFAULT } from './core/sql/SQLHelperWithDefaults.ts';

const profileData = {
  id: 'cpu-profile-123',
  type: 'cpu',
  environment: 'prod',
  timestamp: Date.now(),
  team: DEFAULT,              // Will be filtered out
  benchmark: DEFAULT,         // Will be filtered out
  tier: DEFAULT_VALUES.TIER  // Will be filtered out
};

const query = sql`INSERT INTO "profiles" ${sql(profileData)}`;
// Generated: INSERT INTO "profiles" (id, type, environment, timestamp) VALUES ($1, $2, $3, $4)
// ✅ team, benchmark, tier omitted - database DEFAULTs used
```

### **Using Helper Functions**
```typescript
import { OMEGASQL } from './core/sql/SQLHelperWithDefaults.ts';

// Create profile with DEFAULT values
const profile = OMEGASQL.createProfile({
  type: 'tension',
  environment: 'staging',
  team: 'runtime'  // Override DEFAULT
});

// Result: {
//   id: 'profile-1234567890',
//   type: 'tension',
//   tier: '1380',                    // DEFAULT
//   environment: 'staging',
//   timestamp: 1234567890,
//   team: 'runtime',                 // Override
//   benchmark: 'baseline',           // DEFAULT
//   created_at: 'CURRENT_TIMESTAMP', // DEFAULT
//   updated_at: 'CURRENT_TIMESTAMP'  // DEFAULT
// }
```

### **Settings with DEFAULT Values**
```typescript
const settings = OMEGASQL.createSettings({
  key: 'cpu-threshold',
  value: '80',
  active: DEFAULT  // Use DEFAULT (true)
});

const query = sql`INSERT INTO "settings" ${sql(settings)}`;
// Generated: INSERT INTO "settings" (key, value) VALUES ($1, $2)
// ✅ active omitted - database DEFAULT (true) used
```

## **🔧 Enhanced Features**

### **Type Safety**
```typescript
// Before: Any value allowed
const data: any = { team: undefined };

// After: Type-safe DEFAULT values
const data: InsertData = { 
  team: DEFAULT,                    // ✅ Type-safe
  benchmark: DEFAULT_VALUES.BENCHMARK, // ✅ Type-safe
  tier: '1380'                      // ✅ Type-safe
};
```

### **Consistent DEFAULT Handling**
```typescript
// All of these will be filtered out:
const filteredValues = [
  undefined,           // Filtered out
  DEFAULT,             // Filtered out (explicit)
  DEFAULT_VALUES.TIER, // Filtered out (explicit DEFAULT)
  null                 // ❌ NOT filtered out (explicit NULL)
];
```

### **Helper Methods**
```typescript
// Create profile with sensible DEFAULTs
const profile = SQLHelper.createProfileData({
  type: 'cpu',
  environment: 'prod'
});

// Create settings with DEFAULTs
const settings = SQLHelper.createSettingsData({
  key: 'threshold',
  value: '80'
});
```

## **📊 Database Schema Integration**

### **Profile Table**
```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT '1380',        -- DEFAULT_VALUES.TIER
  environment TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  team TEXT DEFAULT 'unassigned',            -- DEFAULT_VALUES.TEAM
  benchmark TEXT DEFAULT 'baseline',         -- DEFAULT_VALUES.BENCHMARK
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- DEFAULT_VALUES.CREATED_AT
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- DEFAULT_VALUES.UPDATED_AT
);
```

### **Settings Table**
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,               -- DEFAULT_VALUES.ACTIVE
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- DEFAULT_VALUES.CREATED_AT
);
```

## **🚀 OMEGA-Specific Utilities**

### **OMEGASQL Utilities**
```typescript
export const OMEGASQL = {
  // Create profile with DEFAULT values
  createProfile: (overrides: Partial<InsertData> = {}) => 
    SQLHelper.createProfileData(overrides),

  // Create settings with DEFAULT values
  createSettings: (overrides: Partial<InsertData> = {}) => 
    SQLHelper.createSettingsData(overrides),

  // Insert profile with DEFAULT handling
  insertProfile: (profile: InsertData) => {
    const query = SQLHelper.buildInsertQuery(profile, 1);
    return sql`INSERT INTO "profiles" ${query.text}` as SQLQuery;
  },

  // Update profile with DEFAULT handling
  updateProfile: (id: string, updates: InsertData) => {
    const { clause, values } = SQLHelper.buildWhereClause({ id });
    const updateQuery = SQLHelper.buildUpdateQuery('profiles', updates, clause, values);
    return sql`${updateQuery.text}` as SQLQuery;
  },

  // Query profiles with DEFAULT handling
  queryProfiles: (filters: InsertData = {}) => {
    const { clause, values } = SQLHelper.buildWhereClause(filters);
    const selectQuery = SQLHelper.buildSelectQuery('profiles', ['*'], clause, values);
    return sql`${selectQuery.text}` as SQLQuery;
  }
};
```

## **🎯 Benefits for Tier-1380 OMEGA**

### **Type Safety**
✅ **Explicit DEFAULT handling** - Clear intent when using database defaults
✅ **Type-safe constants** - Prevent typos in DEFAULT values
✅ **Consistent API** - Uniform approach to DEFAULT values

### **Developer Experience**
✅ **Helper functions** - Quick creation of objects with DEFAULTs
✅ **Clear semantics** - DEFAULT symbol vs undefined vs null
✅ **Better autocomplete** - TypeScript support for DEFAULT values

### **Database Integration**
✅ **Schema alignment** - DEFAULT constants match database schema
✅ **Consistent behavior** - Predictable DEFAULT value handling
✅ **Migration friendly** - Easy to update DEFAULT values

## **📁 Implementation Files**

- **`core/sql/SQLHelperWithDefaults.ts`** - Enhanced SQL helper with DEFAULT constants
- **`SQL_UNDEFINED_VALUES_FEATURE.md`** - Original undefined values documentation
- **`SQL_WEBSOCKET_INTEGRATION.md`** - Integration documentation

## **🔥 Migration Path**

### **From Undefined Only**
```typescript
// Before
const profile = {
  id: 'profile-123',
  type: 'cpu',
  team: undefined  // Implicit DEFAULT
};

// After
const profile = {
  id: 'profile-123',
  type: 'cpu',
  team: DEFAULT  // Explicit DEFAULT
};
```

### **From Magic Strings**
```typescript
// Before
const profile = {
  team: 'unassigned',  // Magic string
  benchmark: 'baseline' // Magic string
};

// After
const profile = {
  team: DEFAULT_VALUES.TEAM,        // Type-safe constant
  benchmark: DEFAULT_VALUES.BENCHMARK // Type-safe constant
};
```

**The Tier-1380 OMEGA SQL Helper now provides type-safe DEFAULT value handling with explicit constants!** 🔥
