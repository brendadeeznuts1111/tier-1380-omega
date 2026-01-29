import mdx from "@astro/mdx";
import react from "@astro/react";
import { defineConfig } from "astro/config";

/**
 * Astro Configuration for TinaCMS
 *
 * Key settings:
 * - React integration (required for Tina admin interface)
 * - MDX support (for rich content)
 * - Site configuration
 *
 * For more info: https://astro.build/config
 */
export default defineConfig({
	integrations: [
		react(), // Required for TinaCMS admin
		mdx(), // Recommended for rich content
	],

	// Your site URL (for sitemap, canonical URLs, etc.)
	site: "https://example.com",

	// Optional: Server configuration
	server: {
		port: 4321,
		host: "0.0.0.0", // Allows external connections (Docker, network)
	},
});
