/**
 * ts-agent-sdk Direct API Module
 *
 * Typed clients for external API calls.
 *
 * Environment Variables:
 * - SDK_GEMINI_API_KEY: Google Gemini API key
 * - SDK_WORKERS_AI_ACCOUNT_ID: Cloudflare account ID
 * - SDK_WORKERS_AI_API_TOKEN: Cloudflare API token
 * - SDK_SLACK_WEBHOOK_URL: Slack incoming webhook URL
 */

export type { APIResponse, RequestOptions } from "./base";
// Base HTTP client
export { get, post, request } from "./base";
export type { APIConfig } from "./config";
// Configuration
export {
	loadAPIConfig,
	validateGeminiConfig,
	validateSlackConfig,
	validateWorkersAIConfig,
} from "./config";
export type { GeminiContent, GenerateOptions } from "./gemini";
// Gemini AI
export { GeminiClient, gemini } from "./gemini";
export type { CountryInfo, PublicHoliday } from "./public/holidays";
// Public APIs
export * as holidays from "./public/holidays";
export {
	COUNTRY_CODES,
	getAvailableCountries,
	getCountryInfo,
	getNextPublicHoliday,
	getNextPublicHolidays,
	getPublicHolidays,
	isPublicHoliday,
	isTodayPublicHoliday,
} from "./public/holidays";
export type { SlackBlock, SlackMessage } from "./slack";
// Slack
export { SlackClient, slack } from "./slack";
export type { WebhookResponse } from "./webhook";
// Webhooks
export {
	triggerMake,
	triggerN8n,
	triggerZapier,
	WebhookClient,
	webhook,
} from "./webhook";
export type {
	EmbeddingsInput,
	EmbeddingsResponse,
	TextGenerationInput,
	TextGenerationResponse,
} from "./workers-ai";
// Cloudflare Workers AI
export { WORKERS_AI_MODELS, WorkersAIClient, workersAI } from "./workers-ai";
