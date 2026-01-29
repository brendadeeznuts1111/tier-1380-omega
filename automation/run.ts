#!/usr/bin/env bun

/**
 * Tier-1380 OMEGA Automation Runner
 * Simple executable script to run all automation systems
 */

import { DEFAULT_CONFIG, OMEGAOrchestrator } from "./orchestrator";

async function runAutomation() {
	console.log("🚀 Tier-1380 OMEGA Automation System");
	console.log("=====================================\n");

	const orchestrator = new OMEGAOrchestrator(DEFAULT_CONFIG);

	try {
		// Start the orchestrator
		await orchestrator.start();

		// Generate initial report
		const report = await orchestrator.generateReport();
		console.log(report);

		// Run a quick demo of the automation features
		console.log("🎯 Running automation demo...\n");

		// Demo: Manual pipeline trigger
		console.log("📋 Triggering manual pull-request pipeline...");
		await orchestrator.triggerManualPipeline("pull-request");

		// Demo: Generate status report
		console.log("\n📊 Current automation status:");
		const status = orchestrator.getStatus();
		console.log(`- Running: ${status.running}`);
		console.log(
			`- Active processes: ${status.activeProcesses.join(", ") || "None"}`,
		);
		console.log(`- Errors: ${status.errors.length}`);

		console.log("\n✅ Automation demo completed successfully!");
		console.log("🤖 The automation system is now running in the background...");

		// Keep running for demonstration
		setTimeout(async () => {
			console.log("\n📊 Final status report:");
			console.log(await orchestrator.generateReport());
			await orchestrator.stop();
			process.exit(0);
		}, 30000); // Run for 30 seconds then stop
	} catch (error) {
		console.error("💥 Automation system failed:", error);
		await orchestrator.stop();
		process.exit(1);
	}
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
	console.log("\n🛑 Received interrupt signal, shutting down gracefully...");
	process.exit(0);
});

process.on("SIGTERM", async () => {
	console.log("\n🛑 Received termination signal, shutting down gracefully...");
	process.exit(0);
});

// Run the automation
if (import.meta.main) {
	runAutomation();
}

export { runAutomation };
