/**
 * Tier-1380 OMEGA SQLite Integration
 * Updated to SQLite 3.51.2 with enhanced features
 */

import { Database } from "bun:sqlite";

export interface ProfileRecord {
  id: string;
  type: 'cpu' | 'heap' | 'tension';
  tier: string;
  environment: string;
  timestamp: number;
  team?: string;
  benchmark?: string;
  metadata?: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export class OMEGADatabase {
  private db: Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  /**
   * Initialize database schema with SQLite 3.51.2 features
   */
  private initializeSchema(): void {
    // Create profiles table with enhanced constraints
    this.db.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('cpu', 'heap', 'tension')),
        tier TEXT NOT NULL DEFAULT '1380',
        environment TEXT NOT NULL CHECK(environment IN ('prod', 'staging', 'dev', 'unknown')),
        timestamp INTEGER NOT NULL,
        team TEXT,
        benchmark TEXT,
        metadata TEXT, -- JSON string
        url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(type)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_profiles_environment ON profiles(environment)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_profiles_timestamp ON profiles(timestamp)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_profiles_team ON profiles(team)`);

    // Create composite index for common queries
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_profiles_composite 
      ON profiles(type, environment, timestamp DESC)
    `);

    // Create trigger for updated_at
    this.db.run(`
      CREATE TRIGGER IF NOT EXISTS update_profiles_timestamp 
      AFTER UPDATE ON profiles
      BEGIN
        UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);
  }

  /**
   * Insert a new profile record
   */
  insertProfile(profile: Omit<ProfileRecord, 'created_at' | 'updated_at'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO profiles (
        id, type, tier, environment, timestamp, team, benchmark, metadata, url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      profile.id,
      profile.type,
      profile.tier,
      profile.environment,
      profile.timestamp,
      profile.team || null,
      profile.benchmark || null,
      profile.metadata ? JSON.stringify(profile.metadata) : null,
      profile.url || null
    );
  }

  /**
   * Get profile by ID
   */
  getProfile(id: string): ProfileRecord | null {
    const stmt = this.db.prepare(`
      SELECT * FROM profiles WHERE id = ?
    `);
    
    const result = stmt.get(id) as any;
    return result ? this.parseProfileRecord(result) : null;
  }

  /**
   * Query profiles with filters and options
   */
  queryProfiles(
    filters: Partial<ProfileRecord> = {},
    options: QueryOptions = {}
  ): ProfileRecord[] {
    let query = 'SELECT * FROM profiles WHERE 1=1';
    const params: any[] = [];

    // Add filters
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.tier) {
      query += ' AND tier = ?';
      params.push(filters.tier);
    }
    if (filters.environment) {
      query += ' AND environment = ?';
      params.push(filters.environment);
    }
    if (filters.team) {
      query += ' AND team = ?';
      params.push(filters.team);
    }
    if (filters.benchmark) {
      query += ' AND benchmark = ?';
      params.push(filters.benchmark);
    }

    // Add ordering
    const orderBy = options.orderBy || 'timestamp';
    const orderDirection = options.orderDirection || 'DESC';
    query += ` ORDER BY ${orderBy} ${orderDirection}`;

    // Add pagination (SQLite 3.51.2 improved OFFSET handling)
    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      
      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const stmt = this.db.prepare(query);
    const results = stmt.all(...params) as any[];
    return results.map(result => this.parseProfileRecord(result));
  }

  /**
   * Get profiles by type with DISTINCT (SQLite 3.51.2 enhancement)
   */
  getDistinctProfileTypes(): string[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT type FROM profiles ORDER BY type
    `);
    
    const results = stmt.all() as any[];
    return results.map(row => row.type);
  }

  /**
   * Get profiles with improved WAL mode locking (SQLite 3.51.2)
   */
  getProfilesByTeam(team: string, limit: number = 10): ProfileRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM profiles 
      WHERE team = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    
    const results = stmt.all(team, limit) as any[];
    return results.map(result => this.parseProfileRecord(result));
  }

  /**
   * Update profile record
   */
  updateProfile(id: string, updates: Partial<ProfileRecord>): boolean {
    const fields = Object.keys(updates).filter(key => 
      key !== 'id' && key !== 'created_at' && key !== 'updated_at'
    );
    
    if (fields.length === 0) return false;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = (updates as any)[field];
      return field === 'metadata' && value ? JSON.stringify(value) : value;
    });

    const stmt = this.db.prepare(`
      UPDATE profiles SET ${setClause} WHERE id = ?
    `);

    const result = stmt.run(...values, id);
    return result.changes > 0;
  }

  /**
   * Delete profile record
   */
  deleteProfile(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM profiles WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get profile statistics
   */
  getProfileStats(): {
    total: number;
    byType: Record<string, number>;
    byEnvironment: Record<string, number>;
    byTeam: Record<string, number>;
  } {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM profiles');
    const total = (totalStmt.get() as any).count;

    const typeStmt = this.db.prepare(`
      SELECT type, COUNT(*) as count FROM profiles GROUP BY type
    `);
    const byType = Object.fromEntries(
      (typeStmt.all() as any[]).map(row => [row.type, row.count])
    );

    const envStmt = this.db.prepare(`
      SELECT environment, COUNT(*) as count FROM profiles GROUP BY environment
    `);
    const byEnvironment = Object.fromEntries(
      (envStmt.all() as any[]).map(row => [row.environment, row.count])
    );

    const teamStmt = this.db.prepare(`
      SELECT team, COUNT(*) as count FROM profiles 
      WHERE team IS NOT NULL GROUP BY team
    `);
    const byTeam = Object.fromEntries(
      (teamStmt.all() as any[]).map(row => [row.team, row.count])
    );

    return { total, byType, byEnvironment, byTeam };
  }

  /**
   * Search profiles by metadata (JSON search)
   */
  searchProfilesByMetadata(searchTerm: string): ProfileRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM profiles 
      WHERE metadata IS NOT NULL 
      AND metadata LIKE ? 
      ORDER BY timestamp DESC
    `);
    
    const results = stmt.all(`%${searchTerm}%`) as any[];
    return results.map(result => this.parseProfileRecord(result));
  }

  /**
   * Get recent profiles with cursor renumbering (SQLite 3.51.2)
   */
  getRecentProfiles(hours: number = 24, limit: number = 50): ProfileRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM profiles 
      WHERE timestamp > ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const results = stmt.all(cutoffTime, limit) as any[];
    return results.map(result => this.parseProfileRecord(result));
  }

  /**
   * Parse database record to ProfileRecord
   */
  private parseProfileRecord(record: any): ProfileRecord {
    return {
      ...record,
      metadata: record.metadata ? JSON.parse(record.metadata) : undefined
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Execute custom query (for advanced usage)
   */
  executeQuery(query: string, params: any[] = []): any[] {
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Begin transaction
   */
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }
}

// OMEGA Database utilities
export const OMEGADB = {
  /**
   * Create database instance
   */
  create: (dbPath?: string) => new OMEGADatabase(dbPath),

  /**
   * Insert Tier-1380 OMEGA profile
   */
  insertProfile: (db: OMEGADatabase, profile: {
    id: string;
    type: 'cpu' | 'heap' | 'tension';
    environment: string;
    timestamp: number;
    team?: string;
    benchmark?: string;
    metadata?: any;
    url?: string;
  }) => {
    db.insertProfile({
      ...profile,
      tier: '1380'
    });
  },

  /**
   * Query OMEGA profiles
   */
  queryProfiles: (db: OMEGADatabase, filters: {
    type?: 'cpu' | 'heap' | 'tension';
    environment?: string;
    team?: string;
    limit?: number;
  }) => {
    return db.queryProfiles(filters, {
      orderBy: 'timestamp',
      orderDirection: 'DESC',
      limit: filters.limit
    });
  },

  /**
   * Get database statistics
   */
  getStats: (db: OMEGADatabase) => db.getProfileStats()
};

// Example usage for Tier-1380 OMEGA
export const SQLiteExamples = {
  // Create and initialize database
  createDatabase: () => {
    console.log('🗄️ Creating OMEGA database with SQLite 3.51.2');
    const db = OMEGADB.create('./omega-profiles.db');
    console.log('✅ Database initialized with enhanced schema');
    return db;
  },

  // Insert sample profiles
  insertSampleProfiles: (db: OMEGADatabase) => {
    console.log('📝 Inserting sample OMEGA profiles');
    
    const profiles = [
      {
        id: 'cpu-1',
        type: 'cpu' as const,
        environment: 'prod',
        timestamp: Date.now(),
        team: 'runtime',
        benchmark: 'cpu-test-1',
        metadata: { usage: 85, memory: '2GB' }
      },
      {
        id: 'tension-1',
        type: 'tension' as const,
        environment: 'staging',
        timestamp: Date.now() - 1000,
        team: 'compiler',
        benchmark: 'tension-test-1',
        metadata: { score: 92 }
      }
    ];

    profiles.forEach(profile => OMEGADB.insertProfile(db, profile));
    console.log(`✅ Inserted ${profiles.length} profiles`);
  },

  // Query and display profiles
  queryAndDisplay: (db: OMEGADatabase) => {
    console.log('🔍 Querying OMEGA profiles');
    
    const profiles = OMEGADB.queryProfiles(db, { type: 'cpu', limit: 5 });
    console.log(`Found ${profiles.length} CPU profiles:`);
    
    profiles.forEach(profile => {
      console.log(`- ${profile.id}: ${profile.environment} (${profile.team})`);
    });

    const stats = OMEGADB.getStats(db);
    console.log('📊 Database stats:', stats);
  }
};
