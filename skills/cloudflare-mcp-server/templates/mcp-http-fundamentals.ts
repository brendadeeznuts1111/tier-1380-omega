/**
 * MCP HTTP Fundamentals - Minimal Example
 *
 * The SIMPLEST working MCP server demonstrating ONLY URL configuration.
 * Perfect for understanding how base paths work before adding features.
 *
 * This template focuses on THE #1 MISTAKE: URL path mismatches
 *
 * ═══════════════════════════════════════════════════════════════
 * ⚠️  CRITICAL: URL CONFIGURATION EXPLAINED
 * ═══════════════════════════════════════════════════════════════
 *
 * CONCEPT: The base path you use in serveSSE() determines the client URL
 *
 * Example A: Serving at /sse
 * ---------------------------
 * Code:           MyMCP.serveSSE("/sse").fetch(...)
 * Client URL:     "https://worker.dev/sse"  ✅
 * Wrong URL:      "https://worker.dev"      ❌ 404!
 *
 * Example B: Serving at root /
 * ----------------------------
 * Code:           MyMCP.serveSSE("/").fetch(...)
 * Client URL:     "https://worker.dev"      ✅
 * Wrong URL:      "https://worker.dev/sse"  ❌ 404!
 *
 * Example C: Serving at /api/mcp
 * -------------------------------
 * Code:           MyMCP.serveSSE("/api/mcp").fetch(...)
 * Client URL:     "https://worker.dev/api/mcp"  ✅
 * Wrong URL:      "https://worker.dev/sse"      ❌ 404!
 *
 * The pattern: pathname.startsWith("/sse") matches ALL paths like:
 * - /sse
 * - /sse/tools/list
 * - /sse/tools/call
 * - /sse/resources/list
 *
 * ═══════════════════════════════════════════════════════════════
 * 📋 POST-DEPLOYMENT CHECKLIST
 * ═══════════════════════════════════════════════════════════════
 *
 * After running `npx wrangler deploy`:
 *
 * 1. Note the deployed URL (e.g., https://my-mcp.my-account.workers.dev)
 *
 * 2. Test the endpoint:
 *    curl https://my-mcp.my-account.workers.dev/sse
 *    Should return: {"name":"My MCP Server", ...} (not 404!)
 *
 * 3. Update Claude Desktop config with EXACT URL from step 2:
 *    ~/.config/claude/claude_desktop_config.json:
 *    {
 *      "mcpServers": {
 *        "my-mcp": {
 *          "url": "https://my-mcp.my-account.workers.dev/sse"
 *        }
 *      }
 *    }
 *
 * 4. Restart Claude Desktop
 *
 * 5. Verify connection in Claude Desktop (check for tools)
 *
 * ═══════════════════════════════════════════════════════════════
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

type Env = {};

/**
 * Minimal MCP server with ONE simple tool
 */
export class MyMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "My MCP Server",
		version: "1.0.0",
	});

	async init() {
		// One simple tool to verify connection
		this.server.tool(
			"echo",
			"Echo back the provided message (useful for testing connection)",
			{
				message: z.string().describe("The message to echo back"),
			},
			async ({ message }) => ({
				content: [
					{
						type: "text",
						text: `Echo: ${message}`,
					},
				],
			}),
		);
	}
}

/**
 * Worker fetch handler demonstrating URL configuration
 *
 * ═══════════════════════════════════════════════════════════════
 * 🔍 HOW THIS WORKS
 * ═══════════════════════════════════════════════════════════════
 *
 * Request flow:
 * 1. Client sends: https://worker.dev/sse
 * 2. Worker receives request
 * 3. Extract pathname: new URL(request.url).pathname === "/sse"
 * 4. Check: pathname.startsWith("/sse") → TRUE
 * 5. Call: MyMCP.serveSSE("/sse").fetch(...) → Handle MCP request
 * 6. MCP tools available at:
 *    - /sse/tools/list
 *    - /sse/tools/call
 *    - etc.
 *
 * If client sends: https://worker.dev (missing /sse):
 * 1. pathname === "/"
 * 2. Check: pathname.startsWith("/sse") → FALSE
 * 3. Falls through to 404
 *
 * ═══════════════════════════════════════════════════════════════
 */
export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const { pathname } = new URL(request.url);

		// ═══════════════════════════════════════════════════════════════
		// SSE Transport at /sse
		// ═══════════════════════════════════════════════════════════════
		// This matches:
		// - /sse (initial connection)
		// - /sse/tools/list (list available tools)
		// - /sse/tools/call (execute tool)
		// - /sse/resources/list (list resources)
		// - etc.
		//
		// Client URL MUST be: https://worker.dev/sse
		// ═══════════════════════════════════════════════════════════════
		if (pathname.startsWith("/sse")) {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		// ═══════════════════════════════════════════════════════════════
		// Health Check Endpoint
		// ═══════════════════════════════════════════════════════════════
		// Test with: curl https://YOUR-WORKER.workers.dev/
		// Useful for:
		// - Verifying Worker is deployed
		// - Debugging connection issues
		// - Discovering available transports
		// ═══════════════════════════════════════════════════════════════
		if (pathname === "/" || pathname === "/health") {
			return new Response(
				JSON.stringify(
					{
						name: "My MCP Server",
						version: "1.0.0",
						transports: {
							sse: "/sse",
						},
						status: "ok",
						timestamp: new Date().toISOString(),
						help: {
							clientConfig: {
								url: `${new URL(request.url).origin}/sse`,
							},
							testCommand: `curl ${new URL(request.url).origin}/sse`,
						},
					},
					null,
					2,
				),
				{
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		}

		// ═══════════════════════════════════════════════════════════════
		// 404 Not Found
		// ═══════════════════════════════════════════════════════════════
		// If you're seeing this:
		// - Check client URL includes /sse
		// - Try: curl https://YOUR-WORKER.workers.dev/ to see available paths
		// ═══════════════════════════════════════════════════════════════
		return new Response(
			JSON.stringify({
				error: "Not Found",
				requestedPath: pathname,
				availablePaths: ["/sse", "/", "/health"],
				hint: "Client URL must be: https://YOUR-WORKER.workers.dev/sse",
			}),
			{
				status: 404,
				headers: { "Content-Type": "application/json" },
			},
		);
	},
};
