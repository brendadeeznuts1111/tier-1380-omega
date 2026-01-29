#!/usr/bin/env bun

/**
 * Tier-1380 OMEGA CI/CD Pipeline
 * Automated testing, building, and deployment
 */

import { file, spawn } from "bun";

interface PipelineConfig {
	name: string;
	stages: string[];
	environment: "development" | "staging" | "production";
	triggers: string[];
}

interface TestResult {
	name: string;
	passed: boolean;
	duration: number;
	coverage?: number;
	errors?: string[];
}

interface BuildResult {
	name: string;
	success: boolean;
	artifacts: string[];
	size: number;
	duration: number;
}

class OMEGAPipeline {
	private config: PipelineConfig;
	private testResults: TestResult[] = [];
	private buildResults: BuildResult[] = [];

	constructor(config: PipelineConfig) {
		this.config = config;
	}

	async run(): Promise<void> {
		console.log(`🚀 Starting ${this.config.name} Pipeline`);
		console.log(`📧 Environment: ${this.config.environment}`);
		console.log(`🔧 Stages: ${this.config.stages.join(", ")}`);

		for (const stage of this.config.stages) {
			await this.runStage(stage);
		}

		this.generateReport();
	}

	private async runStage(stage: string): Promise<void> {
		console.log(`\n📋 Running stage: ${stage}`);

		switch (stage) {
			case "test":
				await this.runTests();
				break;
			case "build":
				await this.runBuild();
				break;
			case "security":
				await this.runSecurityScan();
				break;
			case "performance":
				await this.runPerformanceTests();
				break;
			case "deploy":
				await this.runDeployment();
				break;
			default:
				console.log(`⚠️  Unknown stage: ${stage}`);
		}
	}

	private async runTests(): Promise<void> {
		console.log("🧪 Running automated test suite...");

		const testSuites = [
			"automation/test-suite.ts",
			"core/sql/SQLHelper.test.ts",
			"core/performance/CRC32Performance.test.ts",
			"core/s3/OMEGAS3RequesterPays.test.ts",
			"core/websocket/OMEGAWebSocketProxy.test.ts",
			"core/sqlite/OMEGADatabase.test.ts",
		];

		for (const suite of testSuites) {
			const result = await this.runTestSuite(suite);
			this.testResults.push(result);
		}

		const passedTests = this.testResults.filter((r) => r.passed).length;
		const totalTests = this.testResults.length;

		console.log(`✅ Tests completed: ${passedTests}/${totalTests} passed`);

		if (passedTests !== totalTests) {
			throw new Error(`❌ ${totalTests - passedTests} test suites failed`);
		}
	}

	private async runTestSuite(suitePath: string): Promise<TestResult> {
		const startTime = performance.now();

		try {
			// Run test suite with Bun
			const proc = spawn(["bun", "test", suitePath], {
				stdout: "pipe",
				stderr: "pipe",
				env: { ...process.env, NODE_ENV: "test" },
			});

			const stdout = await new Response(proc.stdout).text();
			const stderr = await new Response(proc.stderr).text();
			const exitCode = await proc.exited;

			const duration = performance.now() - startTime;
			const passed = exitCode === 0;

			// Extract coverage information if available
			const coverage = this.extractCoverage(stdout);

			return {
				name: suitePath,
				passed,
				duration,
				coverage,
				errors: passed ? undefined : [stderr],
			};
		} catch (error) {
			return {
				name: suitePath,
				passed: false,
				duration: performance.now() - startTime,
				errors: [error instanceof Error ? error.message : "Unknown error"],
			};
		}
	}

	private extractCoverage(output: string): number | undefined {
		const coverageMatch = output.match(/Coverage:\s*(\d+\.?\d*)%/);
		return coverageMatch ? parseFloat(coverageMatch[1]) : undefined;
	}

	private async runBuild(): Promise<void> {
		console.log("🔨 Building Tier-1380 OMEGA artifacts...");

		const builds = [
			{
				name: "core-library",
				command: "bun build src/index.ts --outdir dist --target bun",
			},
			{
				name: "cli-tool",
				command: "bun build src/cli.ts --compile --outfile dist/omega-cli",
			},
			{
				name: "web-bundle",
				command: "bun build src/web.ts --outdir dist/web --target browser",
			},
		];

		for (const build of builds) {
			const result = await this.runBuildStep(build);
			this.buildResults.push(result);
		}

		const successfulBuilds = this.buildResults.filter((r) => r.success).length;
		console.log(
			`✅ Builds completed: ${successfulBuilds}/${this.buildResults.length} successful`,
		);
	}

	private async runBuildStep(build: {
		name: string;
		command: string;
	}): Promise<BuildResult> {
		const startTime = performance.now();

		try {
			const [cmd, ...args] = build.command.split(" ");
			const proc = spawn(cmd, args, {
				stdout: "pipe",
				stderr: "pipe",
			});

			const stdout = await new Response(proc.stdout).text();
			const stderr = await new Response(proc.stderr).text();
			const exitCode = await proc.exited;

			const duration = performance.now() - startTime;
			const success = exitCode === 0;

			// Calculate artifact sizes
			const artifacts = this.getArtifacts(build.name);
			const totalSize = await this.calculateArtifactsSize(artifacts);

			return {
				name: build.name,
				success,
				artifacts,
				size: totalSize,
				duration,
			};
		} catch (error) {
			return {
				name: build.name,
				success: false,
				artifacts: [],
				size: 0,
				duration: performance.now() - startTime,
			};
		}
	}

	private getArtifacts(buildName: string): string[] {
		const artifactMap = {
			"core-library": ["dist/index.js", "dist/index.d.ts"],
			"cli-tool": ["dist/omega-cli"],
			"web-bundle": ["dist/web/index.js", "dist/web/assets/"],
		};

		return artifactMap[buildName as keyof typeof artifactMap] || [];
	}

	private async calculateArtifactsSize(artifacts: string[]): Promise<number> {
		let totalSize = 0;

		for (const artifact of artifacts) {
			try {
				const f = file(artifact);
				if (f) {
					totalSize += f.size;
				}
			} catch {
				// File doesn't exist, skip
			}
		}

		return totalSize;
	}

	private async runSecurityScan(): Promise<void> {
		console.log("🔒 Running security scans...");

		const securityChecks = [
			{ name: "dependency-vulnerabilities", command: "bun audit" },
			{ name: "code-security", command: "bunx eslint --ext .ts,.js src/" },
			{ name: "type-security", command: "bunx tsc --noEmit" },
		];

		for (const check of securityChecks) {
			await this.runSecurityCheck(check);
		}
	}

	private async runSecurityCheck(check: {
		name: string;
		command: string;
	}): Promise<void> {
		try {
			const [cmd, ...args] = check.command.split(" ");
			const proc = spawn(cmd, args, {
				stdout: "pipe",
				stderr: "pipe",
			});

			const stdout = await new Response(proc.stdout).text();
			const stderr = await new Response(proc.stderr).text();
			const exitCode = await proc.exited;

			if (exitCode === 0) {
				console.log(`✅ ${check.name}: PASSED`);
			} else {
				console.log(`❌ ${check.name}: FAILED`);
				console.log(stderr);
			}
		} catch (error) {
			console.log(`❌ ${check.name}: ERROR - ${error}`);
		}
	}

	private async runPerformanceTests(): Promise<void> {
		console.log("⚡ Running performance benchmarks...");

		try {
			const proc = spawn(["bun", "run", "automation/test-suite.ts"], {
				stdout: "pipe",
				stderr: "pipe",
			});

			const stdout = await new Response(proc.stdout).text();
			const stderr = await new Response(proc.stderr).text();
			const exitCode = await proc.exited;

			if (exitCode === 0) {
				console.log("✅ Performance tests: PASSED");
				console.log(stdout);
			} else {
				console.log("❌ Performance tests: FAILED");
				console.log(stderr);
			}
		} catch (error) {
			console.log(`❌ Performance tests: ERROR - ${error}`);
		}
	}

	private async runDeployment(): Promise<void> {
		console.log("🚀 Deploying to environment...");

		if (this.config.environment === "production") {
			await this.deployToProduction();
		} else if (this.config.environment === "staging") {
			await this.deployToStaging();
		} else {
			console.log("🔄 Development environment - skipping deployment");
		}
	}

	private async deployToProduction(): Promise<void> {
		console.log("🏭 Deploying to production...");

		const deploymentSteps = [
			{ name: "push-to-github", command: "git push origin main" },
			{ name: "publish-to-npm", command: "bun publish" },
			{ name: "update-docs", command: "bun run docs:deploy" },
		];

		for (const step of deploymentSteps) {
			await this.runDeploymentStep(step);
		}
	}

	private async deployToStaging(): Promise<void> {
		console.log("🧪 Deploying to staging...");

		const deploymentSteps = [
			{ name: "push-to-staging", command: "git push staging main" },
			{ name: "deploy-staging-env", command: "bun run deploy:staging" },
		];

		for (const step of deploymentSteps) {
			await this.runDeploymentStep(step);
		}
	}

	private async runDeploymentStep(step: {
		name: string;
		command: string;
	}): Promise<void> {
		try {
			const [cmd, ...args] = step.command.split(" ");
			const proc = spawn(cmd, args, {
				stdout: "pipe",
				stderr: "pipe",
			});

			const stdout = await new Response(proc.stdout).text();
			const stderr = await new Response(proc.stderr).text();
			const exitCode = await proc.exited;

			if (exitCode === 0) {
				console.log(`✅ ${step.name}: SUCCESS`);
			} else {
				console.log(`❌ ${step.name}: FAILED`);
				console.log(stderr);
			}
		} catch (error) {
			console.log(`❌ ${step.name}: ERROR - ${error}`);
		}
	}

	private generateReport(): void {
		console.log("\n📊 Pipeline Report");
		console.log("================");

		// Test results
		console.log("\n🧪 Test Results:");
		this.testResults.forEach((result) => {
			const status = result.passed ? "✅" : "❌";
			const coverage = result.coverage ? ` (${result.coverage}% coverage)` : "";
			console.log(
				`  ${status} ${result.name}${coverage} - ${result.duration.toFixed(2)}ms`,
			);
		});

		// Build results
		console.log("\n🔨 Build Results:");
		this.buildResults.forEach((result) => {
			const status = result.success ? "✅" : "❌";
			const size =
				result.size > 0 ? ` (${(result.size / 1024 / 1024).toFixed(2)}MB)` : "";
			console.log(
				`  ${status} ${result.name}${size} - ${result.duration.toFixed(2)}ms`,
			);
		});

		// Summary
		const totalDuration = [...this.testResults, ...this.buildResults].reduce(
			(sum, result) => sum + result.duration,
			0,
		);

		console.log(`\n⏱️  Total Duration: ${totalDuration.toFixed(2)}ms`);
		console.log(`🎯 Pipeline Status: ${this.getPipelineStatus()}`);
	}

	private getPipelineStatus(): string {
		const failedTests = this.testResults.filter((r) => !r.passed).length;
		const failedBuilds = this.buildResults.filter((r) => !r.success).length;

		if (failedTests === 0 && failedBuilds === 0) {
			return "✅ SUCCESS";
		} else {
			return `❌ FAILED (${failedTests} tests, ${failedBuilds} builds)`;
		}
	}
}

// Pipeline configurations
const PIPELINE_CONFIGS: Record<string, PipelineConfig> = {
	"pull-request": {
		name: "Pull Request Pipeline",
		stages: ["test", "security", "build"],
		environment: "development",
		triggers: ["pull_request", "push_to_feature_branch"],
	},
	"main-branch": {
		name: "Main Branch Pipeline",
		stages: ["test", "security", "build", "performance"],
		environment: "staging",
		triggers: ["push_to_main"],
	},
	release: {
		name: "Release Pipeline",
		stages: ["test", "security", "build", "performance", "deploy"],
		environment: "production",
		triggers: ["tag_creation", "manual_release"],
	},
};

// Main execution
async function main() {
	const pipelineName = process.argv[2] || "pull-request";
	const config = PIPELINE_CONFIGS[pipelineName];

	if (!config) {
		console.error(`❌ Unknown pipeline: ${pipelineName}`);
		console.log(
			"Available pipelines:",
			Object.keys(PIPELINE_CONFIGS).join(", "),
		);
		process.exit(1);
	}

	const pipeline = new OMEGAPipeline(config);

	try {
		await pipeline.run();
		console.log("\n🎉 Pipeline completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("\n💥 Pipeline failed:", error);
		process.exit(1);
	}
}

if (import.meta.main) {
	main();
}

export { OMEGAPipeline, PIPELINE_CONFIGS };
