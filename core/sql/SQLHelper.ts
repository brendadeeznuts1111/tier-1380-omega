/**
 * Tier-1380 OMEGA SQL Helper
 * Advanced SQL tagged template helper with undefined value handling and bulk insert support
 */

export interface SQLQuery {
	text: string;
	values: any[];
}

export interface InsertData {
	[key: string]: any;
}

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
				} else if (value !== undefined) {
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
	 * Build INSERT query for single object, filtering out undefined values
	 */
	static buildInsertQuery(data: InsertData, startParamIndex: number): SQLQuery {
		// Filter out undefined values to respect database defaults
		const definedEntries = Object.entries(data).filter(
			([_, value]) => value !== undefined,
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

				if (value !== undefined) {
					rowValues.push(`$${currentParamIndex}`);
					allValues.push(value);
					currentParamIndex++;
				} else {
					// Skip undefined values to respect database defaults
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
			([_, value]) => value !== undefined,
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
			([_, value]) => value !== undefined,
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
}

// Export the sql helper function
export const sql = SQLHelper.sql.bind(SQLHelper);

// Type helpers for better TypeScript support
export type SQLInsert = InsertData;
export type SQLBulkInsert = InsertData[];
export type SQLWhere = InsertData;

// Example usage for Tier-1380 OMEGA
export const OMEGASQLExamples = {
	// Single INSERT with undefined values (respects defaults)
	insertProfile: (profileData: SQLInsert) => {
		const query = SQLHelper.buildInsertQuery(profileData, 1);
		return sql`INSERT INTO "profiles" ${query.text}` as SQLQuery;
	},

	// Bulk INSERT with dynamic columns (fixes data loss bug)
	bulkInsertProfiles: (profiles: SQLBulkInsert) => {
		const query = SQLHelper.buildBulkInsertQuery(profiles, 1);
		return sql`INSERT INTO "profiles" ${query.text}` as SQLQuery;
	},

	// UPDATE with undefined filtering
	updateProfile: (id: string, data: SQLInsert) => {
		const { clause, values } = SQLHelper.buildWhereClause({ id });
		const updateQuery = SQLHelper.buildUpdateQuery(
			"profiles",
			data,
			clause,
			values,
		);
		return sql`${updateQuery.text}` as SQLQuery;
	},

	// SELECT with filters
	selectProfiles: (filters: SQLWhere) => {
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
