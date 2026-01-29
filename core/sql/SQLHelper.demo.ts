/**
 * SQL Helper Demo for Tier-1380 OMEGA
 * Demonstrates undefined value handling and bulk insert functionality
 */

import { OMEGASQLExamples, SQLHelper, sql } from "./SQLHelper.ts";

console.log("🚀 Tier-1380 OMEGA SQL Helper Demo\n");

// Demo 1: Single INSERT with undefined values (respects database defaults)
console.log("📝 Demo 1: Single INSERT with undefined values");
const singleProfile = {
	id: "cpu-profile-123",
	type: "cpu",
	tier: "1380",
	environment: "prod",
	timestamp: Date.now(),
	team: undefined, // Will be omitted to respect database DEFAULT
	benchmark: undefined, // Will be omitted to respect database DEFAULT
	metadata: undefined, // Will be omitted to respect database DEFAULT
};

const singleQuery = SQLHelper.buildInsertQuery(singleProfile, 1);
console.log("SQL:", singleQuery.text);
console.log("Values:", singleQuery.values);
console.log(
	"✅ Undefined values filtered out - database defaults will be used\n",
);

// Demo 2: Bulk INSERT with dynamic column detection (fixes data loss bug)
console.log("📝 Demo 2: Bulk INSERT with dynamic column detection");
const bulkProfiles = [
	{
		id: "tension-profile-1",
		type: "tension",
		tier: "1380",
		environment: "staging",
		timestamp: Date.now(),
		team: undefined, // First object has undefined team
	},
	{
		id: "tension-profile-2",
		type: "tension",
		tier: "1380",
		environment: "staging",
		timestamp: Date.now() + 1000,
		team: "runtime", // Second object has defined team
		benchmark: "tension-test-1", // Second object has additional column
	},
];

const bulkQuery = SQLHelper.buildBulkInsertQuery(bulkProfiles, 1);
console.log("SQL:", bulkQuery.text);
console.log("Values:", bulkQuery.values);
console.log(
	"✅ Dynamic column detection - all columns from all objects included\n",
);

// Demo 3: OMEGA Profile Examples
console.log("📝 Demo 3: OMEGA Profile Examples");

// Example CPU profile insert
const cpuProfileData = {
	environment: "prod",
	team: undefined, // Will respect database default
	metadata: { cpu_usage: 85, memory: "2GB" },
};

const cpuQuery = OMEGASQLExamples.insertProfile(cpuProfileData);
console.log("CPU Profile SQL:", cpuQuery.text);
console.log("CPU Profile Values:", cpuQuery.values);

// Example bulk tension profiles
const tensionProfiles = [
	{ environment: "staging", team: "runtime" },
	{ environment: "staging", team: "compiler", benchmark: "tension-test-2" },
	{
		environment: "prod",
		team: "platform",
		benchmark: "tension-test-3",
		metadata: { score: 95 },
	},
];

const tensionQuery = OMEGASQLExamples.bulkInsertProfiles(tensionProfiles);
console.log("Bulk Tension Profiles SQL:", tensionQuery.text);
console.log("Bulk Tension Profiles Values:", tensionQuery.values);

console.log("\n🎯 Key Benefits Demonstrated:");
console.log(
	"✅ Undefined values are filtered out (respects database defaults)",
);
console.log(
	"✅ Bulk inserts detect all columns from all objects (fixes data loss bug)",
);
console.log("✅ Dynamic column detection prevents silent data loss");
console.log("✅ Type-safe SQL generation for Tier-1380 OMEGA profiles");
console.log("✅ Proper parameterization prevents SQL injection");

console.log("\n🔥 Tier-1380 OMEGA SQL Helper is ready for production!");
