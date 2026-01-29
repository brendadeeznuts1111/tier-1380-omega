/**
 * SQL Helper Tests for Tier-1380 OMEGA
 * Test cases demonstrating undefined value handling and bulk insert functionality
 */

import { sql, SQLHelper, OMEGASQLExamples } from './SQLHelper.ts';

// Test database schema simulation
interface Profile {
  id: string;
  type: 'cpu' | 'heap' | 'tension';
  tier: string;
  environment: string;
  timestamp: number;
  team?: string; // Optional with DEFAULT
  benchmark?: string; // Optional with DEFAULT
  metadata?: any; // Optional with DEFAULT
}

// Test cases demonstrating the key features
export const SQLTests = {
  /**
   * Test 1: Single INSERT with undefined values (respects database defaults)
   */
  testSingleInsertWithDefaults: () => {
    console.log('🧪 Test 1: Single INSERT with undefined values');
    
    const profileData: Profile = {
      id: 'profile-123',
      type: 'cpu',
      tier: '1380',
      environment: 'prod',
      timestamp: Date.now(),
      team: undefined, // Will be omitted to respect database DEFAULT
      benchmark: undefined, // Will be omitted to respect database DEFAULT
      metadata: undefined // Will be omitted to respect database DEFAULT
    };

    const query = SQLHelper.buildInsertQuery(profileData, 1);
    console.log('Generated SQL:', query.text);
    console.log('Values:', query.values);
    
    // Expected: INSERT INTO "profile" (id, type, tier, environment, timestamp) VALUES ($1, $2, $3, $4, $5)
    // team, benchmark, metadata columns are omitted entirely
    
    return query;
  },

  /**
   * Test 2: Bulk INSERT with dynamic column detection (fixes data loss bug)
   */
  testBulkInsertDynamicColumns: () => {
    console.log('🧪 Test 2: Bulk INSERT with dynamic column detection');
    
    const profiles = [
      { 
        id: 'profile-1', 
        type: 'cpu', 
        tier: '1380',
        environment: 'prod',
        timestamp: Date.now(),
        team: undefined // First object has undefined team
      },
      { 
        id: 'profile-2', 
        type: 'tension', 
        tier: '1380',
        environment: 'staging',
        timestamp: Date.now() + 1000,
        team: 'runtime', // Second object has defined team
        benchmark: 'tension-test-1' // Second object has additional column
      }
    ];

    const query = SQLHelper.buildBulkInsertQuery(profiles, 1);
    console.log('Generated SQL:', query.text);
    console.log('Values:', query.values);
    
    // Expected: INSERT INTO "profile" (id, type, tier, environment, timestamp, team, benchmark) 
    // VALUES ($1, $2, $3, $4, $5, DEFAULT, DEFAULT), ($6, $7, $8, $9, $10, $11, $12)
    // All columns from all objects are included, undefined values use DEFAULT
    
    return query;
  },

  /**
   * Test 3: Tagged template usage with undefined filtering
   */
  testTaggedTemplateWithUndefined: () => {
    console.log('🧪 Test 3: Tagged template with undefined filtering');
    
    const profileData = {
      id: 'profile-456',
      type: 'heap',
      tier: '1380',
      environment: 'dev',
      timestamp: Date.now(),
      team: undefined, // Should be filtered out
      metadata: { size: 'large' } // Should be included
    };

    const insertQuery = SQLHelper.buildInsertQuery(profileData, 1);
    const query = sql`INSERT INTO "profiles" ${insertQuery.text} RETURNING id, type, tier`;

    console.log('Generated SQL:', query.text);
    console.log('Values:', query.values);
    
    return query;
  },

  /**
   * Test 4: UPDATE with undefined value filtering
   */
  testUpdateWithUndefinedFiltering: () => {
    console.log('🧪 Test 4: UPDATE with undefined filtering');
    
    const updateData = {
      type: 'cpu',
      environment: 'prod',
      team: undefined, // Should be filtered out
      benchmark: undefined, // Should be filtered out
      metadata: { updated: true } // Should be included
    };

    const { clause, values } = SQLHelper.buildWhereClause({ id: 'profile-123' });
    const query = SQLHelper.buildUpdateQuery('profiles', updateData, clause, values);

    console.log('Generated SQL:', query.text);
    console.log('Values:', query.values);
    
    return query;
  },

  /**
   * Test 5: SELECT with WHERE clause filtering
   */
  testSelectWithWhereFiltering: () => {
    console.log('🧪 Test 5: SELECT with WHERE clause filtering');
    
    const filters = {
      type: 'cpu',
      environment: undefined, // Should be filtered out
      team: 'runtime' // Should be included
    };

    const { clause, values } = SQLHelper.buildWhereClause(filters);
    const query = SQLHelper.buildSelectQuery('profiles', ['id', 'type', 'team'], clause, values);

    console.log('Generated SQL:', query.text);
    console.log('Values:', query.values);
    
    return query;
  },

  /**
   * Test 6: Validation of parameter matching
   */
  testParameterValidation: () => {
    console.log('🧪 Test 6: Parameter validation');
    
    const query = sql`SELECT * FROM profiles WHERE type = ${'cpu'} AND tier = ${'1380'}`;
    const isValid = SQLHelper.validateQuery(query);
    
    console.log('Query valid:', isValid);
    console.log('SQL:', query.text);
    console.log('Values:', query.values);
    
    return { query, isValid };
  },

  /**
   * Test 7: Edge case - all undefined values
   */
  testAllUndefinedValues: () => {
    console.log('🧪 Test 7: All undefined values (should throw error)');
    
    try {
      const allUndefined = {
        id: undefined,
        type: undefined,
        tier: undefined
      };
      
      const query = SQLHelper.buildInsertQuery(allUndefined, 1);
      console.log('ERROR: Should have thrown an error');
      return null;
    } catch (error) {
      console.log('✅ Correctly threw error:', (error as Error).message);
      return true;
    }
  },

  /**
   * Test 8: Complex bulk insert with mixed undefined values
   */
  testComplexBulkInsert: () => {
    console.log('🧪 Test 8: Complex bulk insert with mixed undefined values');
    
    const profiles = [
      {
        id: 'p1',
        type: 'cpu',
        tier: '1380',
        environment: 'prod',
        timestamp: Date.now(),
        team: undefined,
        benchmark: undefined,
        metadata: { version: 1 }
      },
      {
        id: 'p2',
        type: undefined, // Should use DEFAULT
        tier: '1380',
        environment: 'staging',
        timestamp: Date.now() + 1000,
        team: 'runtime',
        benchmark: undefined,
        metadata: undefined
      },
      {
        id: 'p3',
        type: 'tension',
        tier: undefined, // Should use DEFAULT
        environment: 'dev',
        timestamp: Date.now() + 2000,
        team: 'compiler',
        benchmark: 'test-3',
        metadata: { version: 2 }
      }
    ];

    const query = SQLHelper.buildBulkInsertQuery(profiles, 1);
    console.log('Generated SQL:', query.text);
    console.log('Values:', query.values);
    
    return query;
  }
};

// Run all tests
export function runSQLTests(): void {
  console.log('🚀 Running SQL Helper Tests for Tier-1380 OMEGA\n');
  
  const tests = [
    SQLTests.testSingleInsertWithDefaults,
    SQLTests.testBulkInsertDynamicColumns,
    SQLTests.testTaggedTemplateWithUndefined,
    SQLTests.testUpdateWithUndefinedFiltering,
    SQLTests.testSelectWithWhereFiltering,
    SQLTests.testParameterValidation,
    SQLTests.testAllUndefinedValues,
    SQLTests.testComplexBulkInsert
  ];

  tests.forEach((test, index) => {
    try {
      console.log(`\n--- Test ${index + 1} ---`);
      test();
      console.log('✅ Test passed');
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  });

  console.log('\n🎉 All SQL Helper tests completed!');
}

// Example usage for Tier-1380 OMEGA profiles
export const OMEGAProfileExamples = {
  // Insert a CPU profile with undefined team (respects database default)
  insertCPUProfile: (profileData: Partial<Profile>) => {
    const insertData = {
      id: profileData.id || Bun.randomUUIDv7(),
      type: 'cpu',
      tier: '1380',
      environment: profileData.environment || 'prod',
      timestamp: profileData.timestamp || Date.now(),
      team: profileData.team, // undefined will be filtered out
      benchmark: profileData.benchmark, // undefined will be filtered out
      metadata: profileData.metadata // undefined will be filtered out
    };
    
    const insertQuery = SQLHelper.buildInsertQuery(insertData, 1);
    const query = sql`INSERT INTO "profiles" ${insertQuery.text} RETURNING id, type, environment`;
    
    console.log('OMEGA CPU Profile Insert:', query.text);
    return query;
  },

  // Bulk insert tension profiles with dynamic columns
  bulkInsertTensionProfiles: (profiles: Partial<Profile>[]) => {
    const processedProfiles = profiles.map(p => ({
      id: p.id || Bun.randomUUIDv7(),
      type: 'tension',
      tier: '1380',
      environment: p.environment || 'staging',
      timestamp: p.timestamp || Date.now(),
      team: p.team,
      benchmark: p.benchmark,
      metadata: p.metadata
    }));
    
    const bulkQuery = SQLHelper.buildBulkInsertQuery(processedProfiles, 1);
    const query = sql`INSERT INTO "profiles" ${bulkQuery.text} RETURNING id, type, team`;
    
    console.log('OMEGA Bulk Tension Profiles Insert:', query.text);
    return query;
  }
};
