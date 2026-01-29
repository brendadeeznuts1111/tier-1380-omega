/**
 * ts-agent-sdk
 *
 * TypeScript SDK for AI agents to interact with web applications.
 * Supports three access patterns:
 *
 * 1. **MCP Wrapper** - Typed wrapper around MCP server tools
 * 2. **Direct DB** - SQL queries against Cloudflare D1
 * 3. **Direct API** - External service calls (AI, webhooks, etc.)
 *
 * Usage:
 * ```typescript
 * import { docs, db, api } from './sdk';
 *
 * // Pattern 1: MCP Wrapper
 * const result = await docs.createDocument({
 *   spaceId: 'wiki',
 *   title: 'Getting Started',
 *   content: '# Welcome',
 * });
 *
 * // Pattern 2: Direct DB
 * const stats = await db.query('SELECT status, COUNT(*) FROM documents GROUP BY status');
 *
 * // Pattern 3: Direct API
 * const summary = await api.gemini.summarize(content);
 * await api.slack.postMessage('Document created!');
 * ```
 *
 * Environment Variables:
 * - SDK_MODE: 'local' | 'remote' | 'auto' (default: 'auto')
 * - SDK_BASE_URL: Target Worker URL (MCP)
 * - SDK_API_TOKEN: Bearer token for MCP authentication
 * - SDK_GEMINI_API_KEY: Gemini API key
 * - SDK_CF_ACCOUNT_ID: Cloudflare account ID
 * - SDK_CF_API_TOKEN: Cloudflare API token
 * - SDK_D1_DATABASE_ID: D1 database ID
 * - SDK_SLACK_WEBHOOK_URL: Slack webhook URL
 */

// Direct API exports
export * as api from "./api";
export { gemini, slack, triggerN8n, webhook, workersAI } from "./api";
export * as holidays from "./api/public/holidays";
export { defaultClient, MCPClient, type MCPResponse } from "./client";
// Core exports
export {
	type ExecutionMode,
	loadConfig,
	type SDKConfig,
	validateConfig,
} from "./config";
// Direct DB exports
export * as db from "./db";
export { DBClient, db as dbClient } from "./db";
export {
	AuthError,
	MCPError,
	NetworkError,
	NotFoundError,
	RateLimitError,
	SDKError,
	ValidationError,
} from "./errors";

// Module exports (uncomment and add as you generate modules)
// export { docs } from './docs';
// export { enquiries } from './enquiries';
