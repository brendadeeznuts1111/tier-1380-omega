/**
 * ts-agent-sdk Direct DB Module
 *
 * Execute SQL queries directly against Cloudflare D1.
 *
 * Environment Variables:
 * - SDK_DB_MODE: 'local' | 'remote' | 'auto' (default: 'auto')
 * - SDK_D1_DATABASE_NAME: D1 database binding name (default: 'DB')
 * - SDK_D1_DATABASE_ID: D1 database ID (for remote mode)
 * - SDK_CF_ACCOUNT_ID: Cloudflare account ID (for remote mode)
 * - SDK_CF_API_TOKEN: Cloudflare API token (for remote mode)
 */

// Client
export { DBClient, db } from "./client";
// Configuration
export {
	type DBConfig,
	type DBMode,
	getWranglerConfigPath,
	loadDBConfig,
	resolveDBMode,
	validateRemoteConfig,
} from "./config";
// Types
export type {
	AggregateResult,
	CountOptions,
	D1APIResponse,
	D1QueryResult,
	SelectOptions,
	SQLParam,
} from "./types";
