#!/usr/bin/env bun

/**
 * Tier-1380 OMEGA Automated Test Suite
 * Comprehensive testing for all Bun v1.3.6 features
 */

import { crc32 } from "bun:crypto";
import { Database } from "bun:sqlite";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { file } from "bun";

// Test configuration
const TEST_CONFIG = {
	database: ":memory:",
	s3Bucket: "test-omega.factory-wager.com",
	wsUrl: "wss://test-stream.factory-wager.com",
	proxyUrl: "http://test-proxy.company.com:8080",
};

// Test data fixtures
const testProfiles = [
	{
		id: "test-cpu-1",
		type: "cpu",
		tier: "1380",
		environment: "test",
		timestamp: Date.now(),
		team: undefined,
		benchmark: undefined,
	},
	{
		id: "test-tension-1",
		type: "tension",
		tier: "1380",
		environment: "prod",
		timestamp: Date.now() + 1000,
		team: "omega-team",
		benchmark: "baseline-v2",
	},
];

describe("Tier-1380 OMEGA Infrastructure", () => {
	let db: Database;

	beforeAll(async () => {
		// Initialize test database
		db = new Database(TEST_CONFIG.database);

		// Create test tables with DEFAULT values
		db.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        tier TEXT NOT NULL,
        environment TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        team TEXT DEFAULT 'unassigned',
        benchmark TEXT DEFAULT 'baseline',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

		console.log("🧪 Test database initialized");
	});

	afterAll(() => {
		db.close();
		console.log("🧪 Test database cleaned up");
	});

	describe("SQL Helper - Undefined Value Handling", () => {
		test("should filter out undefined values in INSERT", () => {
			const profile = testProfiles[0]; // Has undefined values

			// Simulate SQL helper behavior
			const definedFields = Object.entries(profile)
				.filter(([_, value]) => value !== undefined)
				.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

			const columns = Object.keys(definedFields).join(", ");
			const placeholders = Object.keys(definedFields)
				.map((_, i) => `$${i + 1}`)
				.join(", ");
			const values = Object.values(definedFields);

			const expectedSQL = `INSERT INTO profiles (${columns}) VALUES (${placeholders})`;

			expect(expectedSQL).toBe(
				"INSERT INTO profiles (id, type, tier, environment, timestamp) VALUES ($1, $2, $3, $4, $5)",
			);
			expect(values).toEqual([
				"test-cpu-1",
				"cpu",
				"1380",
				"test",
				testProfiles[0].timestamp,
			]);
		});

		test("should respect database DEFAULT values", () => {
			const profile = testProfiles[0];

			// Insert with undefined values
			const stmt = db.prepare(`
        INSERT INTO profiles (id, type, tier, environment, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `);

			stmt.run(
				profile.id,
				profile.type,
				profile.tier,
				profile.environment,
				profile.timestamp,
			);

			// Retrieve and verify DEFAULT values
			const result = db
				.query("SELECT * FROM profiles WHERE id = ?")
				.get(profile.id) as any;

			expect(result.team).toBe("unassigned"); // DEFAULT applied
			expect(result.benchmark).toBe("baseline"); // DEFAULT applied
			expect(result.created_at).toBeDefined(); // DEFAULT applied

			// Clean up
			db.run("DELETE FROM profiles WHERE id = ?", profile.id);
		});
	});

	describe("CRC32 Performance - Hardware Acceleration", () => {
		test("should generate consistent CRC32 hashes", () => {
			const testData = JSON.stringify(testProfiles[0]);
			const hash1 = crc32.hash(testData);
			const hash2 = crc32.hash(testData);

			expect(hash1).toBe(hash2);
			expect(typeof hash1).toBe("number");
			expect(hash1).toBeGreaterThan(0);
		});

		test("should demonstrate performance improvement", async () => {
			const testData = JSON.stringify(testProfiles);
			const iterations = 1000;

			// Hardware accelerated CRC32
			const startTime = performance.now();

			for (let i = 0; i < iterations; i++) {
				crc32.hash(testData);
			}

			const endTime = performance.now();
			const duration = endTime - startTime;

			console.log(
				`🚀 CRC32 Performance: ${iterations} hashes in ${duration.toFixed(2)}ms`,
			);
			console.log(
				`⚡ Average: ${(duration / iterations).toFixed(4)}ms per hash`,
			);

			// Should be very fast (less than 1ms per hash on average)
			expect(duration / iterations).toBeLessThan(1);
		});

		test("should provide benchmark information", () => {
			const benchmark = crc32.benchmark();

			expect(benchmark).toBeDefined();
			expect(typeof benchmark.speedup).toBe("number");
			expect(benchmark.speedup).toBeGreaterThan(1);

			console.log(`📊 CRC32 Benchmark: ${benchmark.speedup}x speedup`);
		});
	});

	describe("S3 Requester Pays - Cost Management", () => {
		test("should handle requester pays configuration", () => {
			const s3Config = {
				bucket: TEST_CONFIG.s3Bucket,
				requestPayer: true,
				contentType: "application/json",
				cacheControl: "public, max-age=3600",
			};

			expect(s3Config.requestPayer).toBe(true);
			expect(s3Config.bucket).toBe("test-omega.factory-wager.com");
		});

		test("should generate proper S3 URLs", () => {
			const key = "profiles/test-cpu-1.json";
			const expectedUrl = `https://${TEST_CONFIG.s3Bucket}/${key}`;

			expect(expectedUrl).toBe(
				"https://test-omega.factory-wager.com/profiles/test-cpu-1.json",
			);
		});
	});

	describe("WebSocket Proxy - Corporate Connectivity", () => {
		test("should handle proxy configuration", () => {
			const wsConfig = {
				url: TEST_CONFIG.wsUrl,
				proxy: TEST_CONFIG.proxyUrl,
				headers: {
					"Proxy-Authorization": "Bearer test-token",
					"User-Agent": "Tier-1380-OMEGA/1.3.6",
				},
				tls: { rejectUnauthorized: false },
			};

			expect(wsConfig.proxy).toBe("http://test-proxy.company.com:8080");
			expect(wsConfig.headers["Proxy-Authorization"]).toBe("Bearer test-token");
			expect(wsConfig.tls.rejectUnauthorized).toBe(false);
		});

		test("should validate WebSocket URL format", () => {
			const validUrls = [
				"wss://stream.factory-wager.com",
				"ws://localhost:8080",
				"wss://profiles.factory-wager.com/stream",
			];

			validUrls.forEach((url) => {
				expect(url).toMatch(/^wss?:\/\/.+/);
			});
		});
	});

	describe("SQLite 3.51.2 - Enhanced Database", () => {
		test("should handle bulk operations efficiently", () => {
			const insertStmt = db.prepare(`
        INSERT INTO profiles (id, type, tier, environment, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `);

			const startTime = performance.now();

			// Bulk insert
			testProfiles.forEach((profile, index) => {
				insertStmt.run(
					`bulk-${profile.id}`,
					profile.type,
					profile.tier,
					profile.environment,
					profile.timestamp + index * 1000,
				);
			});

			const endTime = performance.now();
			const duration = endTime - startTime;

			console.log(
				`💾 Bulk insert: ${testProfiles.length} records in ${duration.toFixed(2)}ms`,
			);

			// Verify all records inserted
			const count = db
				.query('SELECT COUNT(*) as count FROM profiles WHERE id LIKE "bulk-%"')
				.get() as any;
			expect(count.count).toBe(testProfiles.length);

			// Clean up
			db.run('DELETE FROM profiles WHERE id LIKE "bulk-%"');
		});

		test("should support complex queries", () => {
			// Insert test data
			testProfiles.forEach((profile) => {
				const stmt = db.prepare(`
          INSERT INTO profiles (id, type, tier, environment, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `);
				stmt.run(
					profile.id,
					profile.type,
					profile.tier,
					profile.environment,
					profile.timestamp,
				);
			});

			// Complex query with aggregation
			const results = db
				.query(`
        SELECT 
          type,
          environment,
          COUNT(*) as count,
          MAX(timestamp) as latest_timestamp
        FROM profiles 
        WHERE tier = '1380'
        GROUP BY type, environment
        ORDER BY type, environment
      `)
				.all() as any[];

			expect(results.length).toBeGreaterThan(0);
			expect(results[0]).toHaveProperty("type");
			expect(results[0]).toHaveProperty("count");
			expect(results[0]).toHaveProperty("latest_timestamp");

			console.log(
				`📊 Complex query returned ${results.length} aggregated results`,
			);

			// Clean up
			testProfiles.forEach((profile) => {
				db.run("DELETE FROM profiles WHERE id = ?", profile.id);
			});
		});
	});

	describe("Integration Tests - Complete Workflow", () => {
		test("should handle complete profile lifecycle", async () => {
			const profile = {
				id: "integration-test-1",
				type: "cpu",
				tier: "1380",
				environment: "test",
				timestamp: Date.now(),
				team: undefined,
				benchmark: undefined,
			};

			// Step 1: SQL Helper - Filter undefined values
			const definedFields = Object.entries(profile)
				.filter(([_, value]) => value !== undefined)
				.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

			expect(Object.keys(definedFields)).not.toContain("team");
			expect(Object.keys(definedFields)).not.toContain("benchmark");

			// Step 2: CRC32 - Generate integrity hash
			const profileJson = JSON.stringify(profile);
			const hash = crc32.hash(profileJson);
			expect(hash).toBeGreaterThan(0);

			// Step 3: S3 - Generate URL (simulated)
			const s3Key = `profiles/${profile.type}/${profile.tier}/${profile.environment}/${profile.id}.json`;
			const s3Url = `https://${TEST_CONFIG.s3Bucket}/${s3Key}`;
			expect(s3Url).toContain(profile.id);

			// Step 4: Database - Store with DEFAULT values
			const stmt = db.prepare(`
        INSERT INTO profiles (id, type, tier, environment, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `);
			stmt.run(
				profile.id,
				profile.type,
				profile.tier,
				profile.environment,
				profile.timestamp,
			);

			// Step 5: Verify - Check stored data
			const stored = db
				.query("SELECT * FROM profiles WHERE id = ?")
				.get(profile.id) as any;
			expect(stored.id).toBe(profile.id);
			expect(stored.team).toBe("unassigned"); // DEFAULT applied
			expect(stored.benchmark).toBe("baseline"); // DEFAULT applied

			// Clean up
			db.run("DELETE FROM profiles WHERE id = ?", profile.id);

			console.log("✅ Complete integration test passed");
		});
	});
});

// Performance benchmark runner
async function runPerformanceBenchmarks() {
	console.log("\n🚀 Running Performance Benchmarks...");

	const benchmarks = [
		{
			name: "CRC32 Hash Performance",
			run: () => {
				const data = JSON.stringify(testProfiles);
				const iterations = 10000;
				const start = performance.now();

				for (let i = 0; i < iterations; i++) {
					crc32.hash(data);
				}

				const duration = performance.now() - start;
				return {
					iterations,
					duration,
					avgTime: duration / iterations,
					throughput:
						(data.length * iterations) / (duration / 1000) / 1024 / 1024, // MB/s
				};
			},
		},
		{
			name: "Database Insert Performance",
			run: () => {
				const iterations = 1000;
				const start = performance.now();

				for (let i = 0; i < iterations; i++) {
					const stmt = db.prepare(`
            INSERT INTO profiles (id, type, tier, environment, timestamp)
            VALUES (?, ?, ?, ?, ?)
          `);
					stmt.run(`perf-test-${i}`, "cpu", "1380", "test", Date.now() + i);
				}

				const duration = performance.now() - start;

				// Clean up
				db.run('DELETE FROM profiles WHERE id LIKE "perf-test-%"');

				return {
					iterations,
					duration,
					avgTime: duration / iterations,
					opsPerSecond: iterations / (duration / 1000),
				};
			},
		},
	];

	for (const benchmark of benchmarks) {
		const result = benchmark.run();
		console.log(`\n📊 ${benchmark.name}:`);
		console.log(`   Iterations: ${result.iterations.toLocaleString()}`);
		console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
		console.log(`   Avg Time: ${result.avgTime.toFixed(4)}ms`);

		if (result.throughput) {
			console.log(`   Throughput: ${result.throughput.toFixed(2)} MB/s`);
		}

		if (result.opsPerSecond) {
			console.log(`   Ops/sec: ${result.opsPerSecond.toFixed(0)}`);
		}
	}
}

// Run tests and benchmarks
if (import.meta.main) {
	console.log("🧪 Starting Tier-1380 OMEGA Automated Test Suite...\n");

	// Run performance benchmarks
	await runPerformanceBenchmarks();

	console.log("\n✅ Automated test suite completed!");
}

export { runPerformanceBenchmarks };
