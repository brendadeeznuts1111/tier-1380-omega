/**
 * Tier-1380 OMEGA WebSocket Proxy Integration
 * HTTP/HTTPS proxy support for WebSocket connections in corporate environments
 */

export interface WebSocketProxyOptions {
	url: string;
	headers?: Record<string, string>;
}

export interface WebSocketOptions {
	proxy?: string | WebSocketProxyOptions;
	tls?: {
		rejectUnauthorized?: boolean;
		ca?: string;
		cert?: string;
		key?: string;
		passphrase?: string;
	};
}

export class OMEGAWebSocketProxy {
	/**
	 * Create WebSocket with proxy support
	 */
	static createWebSocket(url: string, options?: WebSocketOptions): WebSocket {
		return new WebSocket(url, options);
	}

	/**
	 * Connect through simple HTTP proxy
	 */
	static connectViaHTTPProxy(wsUrl: string, proxyUrl: string): WebSocket {
		return new WebSocket(wsUrl, {
			proxy: proxyUrl,
		});
	}

	/**
	 * Connect through authenticated proxy
	 */
	static connectViaAuthenticatedProxy(
		wsUrl: string,
		proxyUrl: string,
		username: string,
		password: string,
	): WebSocket {
		const authenticatedProxy = proxyUrl.includes("@")
			? proxyUrl
			: proxyUrl.replace("://", `://${username}:${password}@`);

		return new WebSocket(wsUrl, {
			proxy: authenticatedProxy,
		});
	}

	/**
	 * Connect through HTTPS proxy with custom TLS options
	 */
	static connectViaHTTPSProxy(
		wsUrl: string,
		proxyUrl: string,
		tlsOptions?: WebSocketOptions["tls"],
	): WebSocket {
		return new WebSocket(wsUrl, {
			proxy: proxyUrl,
			tls: tlsOptions || { rejectUnauthorized: false },
		});
	}

	/**
	 * Connect with custom proxy headers
	 */
	static connectWithCustomHeaders(
		wsUrl: string,
		proxyUrl: string,
		headers: Record<string, string>,
	): WebSocket {
		return new WebSocket(wsUrl, {
			proxy: {
				url: proxyUrl,
				headers,
			},
		});
	}

	/**
	 * Test WebSocket connectivity through proxy
	 */
	static async testProxyConnection(
		wsUrl: string,
		proxyOptions: string | WebSocketProxyOptions,
	): Promise<{ success: boolean; error?: string; latency?: number }> {
		const startTime = performance.now();

		try {
			const ws = new WebSocket(wsUrl, { proxy: proxyOptions });

			return new Promise((resolve) => {
				const timeout = setTimeout(() => {
					ws.close();
					resolve({ success: false, error: "Connection timeout" });
				}, 5000);

				ws.onopen = () => {
					const endTime = performance.now();
					const latency = Math.round(endTime - startTime);
					clearTimeout(timeout);
					ws.close();
					resolve({ success: true, latency });
				};

				ws.onerror = (event) => {
					clearTimeout(timeout);
					resolve({
						success: false,
						error: event.type || "WebSocket error",
					});
				};
			});
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Create WebSocket for OMEGA profile streaming
	 */
	static createOMEGAProfileWebSocket(
		endpoint: string,
		proxyOptions?: WebSocketProxyOptions,
	): WebSocket {
		const wsUrl = `wss://profiles.factory-wager.com/${endpoint}`;

		return new WebSocket(wsUrl, {
			proxy: proxyOptions,
			headers: {
				"User-Agent": "Tier-1380-OMEGA/1.0",
				"X-OMEGA-Tier": "1380",
			},
		});
	}

	/**
	 * Monitor WebSocket connection health
	 */
	static monitorWebSocketHealth(
		ws: WebSocket,
		onHealthChange: (healthy: boolean) => void,
	): () => void {
		let healthy = true;
		let pingInterval: NodeJS.Timeout;

		const startHealthCheck = () => {
			pingInterval = setInterval(() => {
				if (ws.readyState === WebSocket.OPEN) {
					ws.ping();
				} else if (ws.readyState !== WebSocket.CONNECTING) {
					if (healthy) {
						healthy = false;
						onHealthChange(false);
					}
				}
			}, 30000); // Ping every 30 seconds
		};

		ws.onopen = () => {
			healthy = true;
			onHealthChange(true);
			startHealthCheck();
		};

		ws.onclose = () => {
			healthy = false;
			onHealthChange(false);
			if (pingInterval) clearInterval(pingInterval);
		};

		ws.onerror = () => {
			if (healthy) {
				healthy = false;
				onHealthChange(false);
			}
		};

		ws.onpong = () => {
			if (!healthy) {
				healthy = true;
				onHealthChange(true);
			}
		};

		return () => {
			if (pingInterval) clearInterval(pingInterval);
		};
	}
}

// OMEGA WebSocket proxy utilities
export const OMEGAWebSocket = {
	/**
	 * Connect to OMEGA profile stream through corporate proxy
	 */
	connectProfileStream: (proxyUrl: string) => {
		console.log("🔌 Connecting to OMEGA profile stream through proxy");
		return OMEGAWebSocketProxy.createOMEGAProfileWebSocket("stream/profiles", {
			url: proxyUrl,
		});
	},

	/**
	 * Connect with authentication
	 */
	connectAuthenticated: (
		wsUrl: string,
		proxyUrl: string,
		credentials: { username: string; password: string },
	) => {
		console.log("🔐 Connecting with authenticated proxy");
		return OMEGAWebSocketProxy.connectViaAuthenticatedProxy(
			wsUrl,
			proxyUrl,
			credentials.username,
			credentials.password,
		);
	},

	/**
	 * Test proxy connectivity
	 */
	testProxy: async (wsUrl: string, proxyUrl: string) => {
		console.log("🧪 Testing proxy connectivity");
		const result = await OMEGAWebSocketProxy.testProxyConnection(
			wsUrl,
			proxyUrl,
		);

		if (result.success) {
			console.log(
				`✅ Proxy connection successful (${result.latency}ms latency)`,
			);
		} else {
			console.log(`❌ Proxy connection failed: ${result.error}`);
		}

		return result;
	},

	/**
	 * Create resilient WebSocket connection
	 */
	createResilientConnection: (
		wsUrl: string,
		proxyOptions: WebSocketProxyOptions,
		onMessage: (data: any) => void,
	) => {
		console.log("🔄 Creating resilient WebSocket connection");

		const ws = OMEGAWebSocketProxy.createWebSocket(wsUrl, {
			proxy: proxyOptions,
		});
		let reconnectAttempts = 0;
		const maxReconnectAttempts = 5;

		const connect = () => {
			ws.onopen = () => {
				console.log("✅ WebSocket connected");
				reconnectAttempts = 0;
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					onMessage(data);
				} catch (error) {
					console.error("Failed to parse message:", error);
				}
			};

			ws.onclose = () => {
				console.log("🔌 WebSocket closed");

				if (reconnectAttempts < maxReconnectAttempts) {
					reconnectAttempts++;
					console.log(
						`🔄 Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`,
					);
					setTimeout(connect, 1000 * reconnectAttempts);
				} else {
					console.error("❌ Max reconnection attempts reached");
				}
			};

			ws.onerror = (error) => {
				console.error("❌ WebSocket error:", error);
			};
		};

		connect();
		return ws;
	},
};

// Example usage for Tier-1380 OMEGA
export const WebSocketExamples = {
	// Connect through simple HTTP proxy
	simpleProxy: () => {
		console.log("🔌 Simple proxy connection");
		const ws = OMEGAWebSocketProxy.connectViaHTTPProxy(
			"wss://profiles.factory-wager.com/stream",
			"http://proxy.company.com:8080",
		);

		ws.onopen = () => console.log("✅ Connected through proxy");
		return ws;
	},

	// Connect with authentication
	authenticatedProxy: () => {
		console.log("🔐 Authenticated proxy connection");
		const ws = OMEGAWebSocketProxy.connectViaAuthenticatedProxy(
			"wss://profiles.factory-wager.com/stream",
			"http://proxy.company.com:8080",
			"user123",
			"pass456",
		);

		ws.onopen = () => console.log("✅ Connected through authenticated proxy");
		return ws;
	},

	// HTTPS proxy with TLS options
	httpsProxy: () => {
		console.log("🔒 HTTPS proxy with TLS");
		const ws = OMEGAWebSocketProxy.connectViaHTTPSProxy(
			"wss://profiles.factory-wager.com/stream",
			"https://secure-proxy.company.com:8443",
			{ rejectUnauthorized: false },
		);

		ws.onopen = () => console.log("✅ Connected through HTTPS proxy");
		return ws;
	},

	// Custom headers proxy
	customHeadersProxy: () => {
		console.log("📋 Custom headers proxy");
		const ws = OMEGAWebSocketProxy.connectWithCustomHeaders(
			"wss://profiles.factory-wager.com/stream",
			"http://proxy.company.com:8080",
			{
				"Proxy-Authorization": "Bearer token123",
				"X-Custom-Header": "OMEGA-1380",
			},
		);

		ws.onopen = () => console.log("✅ Connected with custom headers");
		return ws;
	},

	// Test all proxy types
	testAllProxies: async () => {
		console.log("🧪 Testing all proxy configurations");

		const testUrl = "wss://echo.websocket.org";
		const proxies = [
			"http://proxy.company.com:8080",
			"https://secure-proxy.company.com:8443",
		];

		for (const proxy of proxies) {
			await OMEGAWebSocket.testProxy(testUrl, proxy);
		}
	},
};
