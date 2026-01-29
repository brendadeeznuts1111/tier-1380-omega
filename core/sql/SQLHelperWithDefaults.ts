/**
 * Tier-1380 OMEGA SQL Helper with DEFAULT Constants
 * Enhanced with DEFAULT value constants for better type safety and consistency
 */

export interface SQLQuery {
	text: string;
	values: any[];
}

export interface InsertData {
	[key: string]: any;
}

// DEFAULT value constants for type safety
export const DEFAULT = Symbol("DEFAULT");
export const DEFAULT_VALUES = {
	TEAM: "unassigned",
	BENCHMARK: "baseline",
	TIER: "1380",
	ENVIRONMENT: "unknown",
	CREATED_AT: "CURRENT_TIMESTAMP",
	UPDATED_AT: "CURRENT_TIMESTAMP",
	ACTIVE: true,
	SCORE: 0,
	STATUS: "pending",
	PRIORITY: "medium",
} as const;

// Type for DEFAULT values
export type DefaultValue =
	| typeof DEFAULT
	| (typeof DEFAULT_VALUES)[keyof typeof DEFAULT_VALUES];

export class SQLHelper {
	/**
	 * SQL tagged template helper that filters out undefined values
	 * and properly handles bulk inserts with dynamic column detection
	 */
	static sql(strings: TemplateStringsArray, ...values: any[]): SQLQuery {
		let text = "";
		const params: any[] = [];
		let paramIndex = 1;

		for (let i = 0; i < strings.length; i++) {
			text += strings[i];

			if (i < values.length) {
				const value = values[i];

				if (SQLHelper.isInsertObject(value)) {
					const insertQuery = SQLHelper.buildInsertQuery(value, paramIndex);
					text += insertQuery.text;
					params.push(...insertQuery.values);
					paramIndex += insertQuery.values.length;
				} else if (SQLHelper.isInsertArray(value)) {
					const bulkInsertQuery = SQLHelper.buildBulkInsertQuery(
						value,
						paramIndex,
					);
					text += bulkInsertQuery.text;
					params.push(...bulkInsertQuery.values);
					paramIndex += bulkInsertQuery.values.length;
				} else if (value !== undefined && value !== DEFAULT) {
					text += `$${paramIndex}`;
					params.push(value);
					paramIndex++;
				}
			}
		}

		return { text, values: params };
	}

	/**
	 * Check if value is an INSERT object
	 */
	private static isInsertObject(value: any): value is InsertData {
		return (
			value &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			!SQLHelper.isSQLQuery(value)
		);
	}

	/**
	 * Check if value is an array of INSERT objects
	 */
	private static isInsertArray(value: any): value is InsertData[] {
		return (
			Array.isArray(value) &&
			value.length > 0 &&
			value.every(
				(item) => item && typeof item === "object" && !Array.isArray(item),
			)
		);
	}

	/**
	 * Check if value is already a SQLQuery
	 */
	private static isSQLQuery(value: any): value is SQLQuery {
		return (
			value && typeof value === "object" && "text" in value && "values" in value
		);
	}

	/**
	 * Build INSERT query for single object, filtering out undefined values and DEFAULT symbols
	 */
	static buildInsertQuery(data: InsertData, startParamIndex: number): SQLQuery {
		// Filter out undefined values and DEFAULT symbols to respect database defaults
		const definedEntries = Object.entries(data).filter(
			([_, value]) => value !== undefined && value !== DEFAULT,
		);

		if (definedEntries.length === 0) {
			throw new Error("INSERT object must have at least one defined value");
		}

		const columns = definedEntries.map(([key]) =>
			SQLHelper.quoteIdentifier(key),
		);
		const placeholders = definedEntries.map(
			(_, index) => `$${startParamIndex + index}`,
		);
		const values = definedEntries.map(([_, value]) => value);

		const text = `(${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;

		return { text, values };
	}

	/**
	 * Build bulk INSERT query with dynamic column detection from all objects
	 */
	static buildBulkInsertQuery(
		dataArray: InsertData[],
		startParamIndex: number,
	): SQLQuery {
		if (dataArray.length === 0) {
			throw new Error("Bulk INSERT array must contain at least one object");
		}

		// Collect all possible columns from all objects (fixes data loss bug)
		const allColumns = new Set<string>();
		for (const data of dataArray) {
			Object.keys(data).forEach((key) => allColumns.add(key));
		}

		const columnList = Array.from(allColumns);
		const quotedColumns = columnList.map((col) =>
			SQLHelper.quoteIdentifier(col),
		);

		// Build VALUES clauses for each row
		const valuesClauses: string[] = [];
		const allValues: any[] = [];
		let currentParamIndex = startParamIndex;

		for (const data of dataArray) {
			const rowValues: string[] = [];

			for (const column of columnList) {
				const value = data[column];

				if (value !== undefined && value !== DEFAULT) {
					rowValues.push(`$${currentParamIndex}`);
					allValues.push(value);
					currentParamIndex++;
				} else {
					// Skip undefined values and DEFAULT symbols to respect database defaults
					rowValues.push("DEFAULT");
				}
			}

			valuesClauses.push(`(${rowValues.join(", ")})`);
		}

		const text = `(${quotedColumns.join(", ")}) VALUES ${valuesClauses.join(", ")}`;

		return { text, values: allValues };
	}

	/**
	 * Quote identifiers safely
	 */
	private static quoteIdentifier(identifier: string): string {
		// Handle double quotes in identifiers
		const escaped = identifier.replace(/"/g, '""');
		return `"${escaped}"`;
	}

	/**
	 * Build UPDATE query with undefined value filtering
	 */
	static buildUpdateQuery(
		table: string,
		data: InsertData,
		whereClause: string,
		whereValues: any[] = [],
	): SQLQuery {
		const definedEntries = Object.entries(data).filter(
			([_, value]) => value !== undefined && value !== DEFAULT,
		);

		if (definedEntries.length === 0) {
			throw new Error("UPDATE object must have at least one defined value");
		}

		const setClauses = definedEntries.map(
			([key, _], index) => `${SQLHelper.quoteIdentifier(key)} = $${index + 1}`,
		);

		const values = definedEntries.map(([_, value]) => value);
		const allValues = [...values, ...whereValues];

		const text = `UPDATE ${SQLHelper.quoteIdentifier(table)} SET ${setClauses.join(", ")} ${whereClause}`;

		return { text, values: allValues };
	}

	/**
	 * Build SELECT query with optional WHERE clause
	 */
	static buildSelectQuery(
		table: string,
		columns: string[] = ["*"],
		whereClause?: string,
		whereValues: any[] = [],
	): SQLQuery {
		const quotedColumns = columns.map((col) => {
			if (col === "*") return "*";
			return SQLHelper.quoteIdentifier(col);
		});

		let text = `SELECT ${quotedColumns.join(", ")} FROM ${SQLHelper.quoteIdentifier(table)}`;

		if (whereClause) {
			text += ` ${whereClause}`;
		}

		return { text, values: whereValues };
	}

	/**
	 * Build DELETE query with WHERE clause
	 */
	static buildDeleteQuery(
		table: string,
		whereClause: string,
		whereValues: any[] = [],
	): SQLQuery {
		const text = `DELETE FROM ${SQLHelper.quoteIdentifier(table)} ${whereClause}`;
		return { text, values: whereValues };
	}

	/**
	 * Create a parameterized WHERE clause from filter object
	 */
	static buildWhereClause(
		filters: InsertData,
		operator: "AND" | "OR" = "AND",
	): { clause: string; values: any[] } {
		const definedEntries = Object.entries(filters).filter(
			([_, value]) => value !== undefined && value !== DEFAULT,
		);

		if (definedEntries.length === 0) {
			return { clause: "", values: [] };
		}

		const conditions = definedEntries.map(
			([key, _], index) => `${SQLHelper.quoteIdentifier(key)} = $${index + 1}`,
		);

		const values = definedEntries.map(([_, value]) => value);
		const clause = `WHERE ${conditions.join(` ${operator} `)}`;

		return { clause, values };
	}

	/**
	 * Validate SQL query for safety
	 */
	static validateQuery(query: SQLQuery): boolean {
		// Basic validation - check for parameter count mismatch
		const paramMatches = query.text.match(/\$\d+/g);
		const paramCount = paramMatches ? paramMatches.length : 0;

		if (paramCount !== query.values.length) {
			console.warn(
				`Parameter count mismatch: ${paramCount} placeholders, ${query.values.length} values`,
			);
			return false;
		}

		return true;
	}

	/**
	 * Create profile data with DEFAULT constants
	 */
	static createProfileData(overrides: Partial<InsertData> = {}): InsertData {
		return {
			id: `profile-${Date.now()}`,
			type: "cpu",
			tier: DEFAULT_VALUES.TIER,
			environment: DEFAULT_VALUES.ENVIRONMENT,
			timestamp: Date.now(),
			team: DEFAULT_VALUES.TEAM,
			benchmark: DEFAULT_VALUES.BENCHMARK,
			created_at: DEFAULT_VALUES.CREATED_AT,
			updated_at: DEFAULT_VALUES.UPDATED_AT,
			...overrides,
		};
	}

	/**
	 * Create settings data with DEFAULT constants
	 */
	static createSettingsData(overrides: Partial<InsertData> = {}): InsertData {
		return {
			key: "",
			value: "",
			description: undefined,
			active: DEFAULT_VALUES.ACTIVE,
			created_at: DEFAULT_VALUES.CREATED_AT,
			...overrides,
		};
	}
}

// Export the sql helper function
export const sql = SQLHelper.sql.bind(SQLHelper);

// Type helpers for better TypeScript support
export type SQLInsert = InsertData;
export type SQLBulkInsert = InsertData[];
export type SQLWhere = InsertData;

// OMEGA-specific SQL utilities with DEFAULT constants
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
		const updateQuery = SQLHelper.buildUpdateQuery(
			"profiles",
			updates,
			clause,
			values,
		);
		return sql`${updateQuery.text}` as SQLQuery;
	},

	// Query profiles with DEFAULT handling
	queryProfiles: (filters: InsertData = {}) => {
		const { clause, values } = SQLHelper.buildWhereClause(filters);
		const selectQuery = SQLHelper.buildSelectQuery(
			"profiles",
			["*"],
			clause,
			values,
		);
		return sql`${selectQuery.text}` as SQLQuery;
	},
};

// Example usage for Tier-1380 OMEGA with DEFAULT constants
export const OMEGAExamples = {
	// Profile with explicit DEFAULT values
	createProfileWithDefaults: () => {
		const profile = {
			id: "cpu-profile-123",
			type: "cpu",
			environment: "prod",
			timestamp: Date.now(),
			team: DEFAULT, // Will be filtered out
			benchmark: DEFAULT_VALUES.BENCHMARK, // Will be filtered out
			tier: DEFAULT_VALUES.TIER, // Will be filtered out
		};

		const query = OMEGASQL.insertProfile(profile);
		console.log("Profile with DEFAULTs:", query.text);
		return query;
	},

	// Profile using helper with DEFAULT constants
	createProfileUsingHelper: () => {
		const profile = OMEGASQL.createProfile({
			type: "tension",
			environment: "staging",
			team: "runtime", // Override DEFAULT
		});

		const query = OMEGASQL.insertProfile(profile);
		console.log("Profile using helper:", query.text);
		return query;
	},

	// Settings with DEFAULT values
	createSettingsWithDefaults: () => {
		const settings = OMEGASQL.createSettings({
			key: "cpu-threshold",
			value: "80",
			active: DEFAULT, // Use DEFAULT (true)
		});

		const query = sql`INSERT INTO "settings" ${sql(settings)}`;
		console.log("Settings with DEFAULTs:", query.text);
		return query;
	},
};
