#!/usr/bin/env bun
/**
 * Tier-1380 OMEGA Profile CLI
 * Command-line interface for profile URL management and resolution
 */

import {
	generateProfileUrlCli,
	generateSequenceCli,
	parseProfileUrlCli,
	profilePublisher,
} from "../core/profile/ProfilePublisher.ts";

interface CliOptions {
	type?: string;
	environment?: string;
	timestamp?: string;
	team?: string;
	benchmark?: string;
	format?: string;
	count?: number;
	validate?: boolean;
	help?: boolean;
}

class ProfileCLI {
	private readonly commands = {
		generate: this.generateProfile.bind(this),
		parse: this.parseProfile.bind(this),
		sequence: this.generateSequence.bind(this),
		latest: this.getLatest.bind(this),
		validate: this.validateProfile.bind(this),
		badge: this.createBadge.bind(this),
		help: this.showHelp.bind(this),
	};

	async run(args: string[]): Promise<void> {
		const [command, ...rest] = args;

		if (!command || command === "help") {
			this.showHelp();
			return;
		}

		const handler = this.commands[command as keyof typeof this.commands];
		if (!handler) {
			console.error(`❌ Unknown command: ${command}`);
			this.showHelp();
			process.exit(1);
		}

		try {
			await handler(rest);
		} catch (error) {
			console.error(`❌ Error executing ${command}:`, error);
			process.exit(1);
		}
	}

	private async generateProfile(args: string[]): Promise<void> {
		const options = this.parseArgs(args);

		if (!options.type) {
			console.error(
				"❌ Profile type required (cpu, heap, tension, memory, performance)",
			);
			return;
		}

		const profileUrl = profilePublisher.generateProfileUrl({
			type: options.type as any,
			environment: (options.environment as any) || "prod",
			timestamp: options.timestamp
				? parseInt(options.timestamp, 10)
				: Date.now(),
			team: options.team,
			benchmark: options.benchmark,
			format: (options.format as any) || "md",
		});

		console.log("🔗 Generated Profile URL:");
		console.log(`URL: ${profileUrl.url}`);
		console.log(`Filename: ${profileUrl.filename}`);
		console.log(`Path: ${profileUrl.path}`);
		console.log(`Metadata:`, JSON.stringify(profileUrl.metadata, null, 2));
	}

	private async parseProfile(args: string[]): Promise<void> {
		const [url] = args;
		if (!url) {
			console.error("❌ Profile URL required");
			return;
		}

		const metadata = profilePublisher.parseProfileUrl(url);
		if (!metadata) {
			console.error(
				"❌ Invalid profile URL or does not follow Tier-1380 OMEGA convention",
			);
			return;
		}

		console.log("📋 Parsed Profile Metadata:");
		console.log(JSON.stringify(metadata, null, 2));

		// Reconstruct URL to verify
		const reconstructed = profilePublisher.generateProfileUrl(metadata);
		console.log(`\n🔄 Reconstructed URL: ${reconstructed.url}`);
	}

	private async generateSequence(args: string[]): Promise<void> {
		const options = this.parseArgs(args);

		if (!options.type) {
			console.error("❌ Profile type required");
			return;
		}

		const count = options.count || 10;
		const environment = (options.environment as any) || "prod";
		const startTimestamp = options.timestamp
			? parseInt(options.timestamp, 10)
			: Date.now();

		const sequence = profilePublisher.generateProfileSequence(
			options.type as any,
			count,
			environment,
			startTimestamp,
		);

		console.log(`📊 Generated ${count} ${options.type} profile URLs:`);
		sequence.forEach((profile, index) => {
			console.log(`${index + 1}. ${profile.url}`);
		});

		// Save to file for reference
		const sequenceData = {
			type: options.type,
			environment,
			count,
			generated_at: new Date().toISOString(),
			profiles: sequence,
		};

		await Bun.write(
			`./profiles-${options.type}-${environment}-sequence.json`,
			JSON.stringify(sequenceData, null, 2),
		);

		console.log(
			`\n💾 Sequence saved to: profiles-${options.type}-${environment}-sequence.json`,
		);
	}

	private async getLatest(args: string[]): Promise<void> {
		const [type, environment = "prod"] = args;

		if (!type) {
			console.error("❌ Profile type required");
			return;
		}

		const latest = await profilePublisher.getLatestProfile(
			type as any,
			environment as any,
		);

		if (!latest) {
			console.log(
				`❌ No latest ${type} profile found for ${environment} environment`,
			);
			return;
		}

		console.log("🔥 Latest Profile:");
		console.log(`URL: ${latest.url}`);
		console.log(`Environment: ${latest.metadata.environment}`);
		console.log(
			`Timestamp: ${new Date(latest.metadata.timestamp).toISOString()}`,
		);
	}

	private async validateProfile(args: string[]): Promise<void> {
		const [url] = args;

		if (!url) {
			console.error("❌ Profile URL required");
			return;
		}

		const isValid = profilePublisher.validateProfileUrl(url);

		if (isValid) {
			console.log("✅ Profile URL follows Tier-1380 OMEGA convention");
			const metadata = profilePublisher.parseProfileUrl(url);
			console.log("Metadata:", JSON.stringify(metadata, null, 2));
		} else {
			console.log("❌ Profile URL does NOT follow Tier-1380 OMEGA convention");
			console.log(
				"Expected pattern: https://profiles.factory-wager.com/{type}/{tier}/{environment}/{timestamp}_{type}-{timestamp}.{format}",
			);
		}
	}

	private async createBadge(args: string[]): Promise<void> {
		const [url] = args;

		if (!url) {
			console.error("❌ Profile URL required");
			return;
		}

		const metadata = profilePublisher.parseProfileUrl(url);
		if (!metadata) {
			console.error("❌ Invalid profile URL");
			return;
		}

		const profileUrl = profilePublisher.generateProfileUrl(metadata);
		const badge = profilePublisher.createProfileBadge(profileUrl);

		console.log(`🎭 Profile Badge: ${badge}`);
		console.log(`Type: ${metadata.type}`);
		console.log(`Environment: ${metadata.environment}`);
		console.log(`URL: ${profileUrl.url}`);
	}

	private parseArgs(args: string[]): CliOptions {
		const options: CliOptions = {};

		for (let i = 0; i < args.length; i += 2) {
			const flag = args[i];
			const value = args[i + 1];

			switch (flag) {
				case "--type":
					options.type = value;
					break;
				case "--env":
					options.environment = value;
					break;
				case "--timestamp":
					options.timestamp = value;
					break;
				case "--team":
					options.team = value;
					break;
				case "--benchmark":
					options.benchmark = value;
					break;
				case "--format":
					options.format = value;
					break;
				case "--count":
					options.count = parseInt(value, 10);
					break;
				case "--validate":
					options.validate = true;
					i--; // This is a flag, not a key-value pair
					break;
				case "--help":
					options.help = true;
					i--; // This is a flag, not a key-value pair
					break;
			}
		}

		return options;
	}

	private showHelp(): void {
		console.log(`
🔥 Tier-1380 OMEGA Profile CLI

USAGE:
  bun omega:profile <command> [options]

COMMANDS:
  generate     Generate a new profile URL
  parse        Parse existing profile URL
  sequence     Generate sequence of profile URLs
  latest       Get latest profile for type/environment
  validate     Validate profile URL follows OMEGA convention
  badge        Create visual badge for profile
  help         Show this help message

EXAMPLES:
  # Generate CPU profile URL
  bun omega:profile generate --type cpu --env prod

  # Parse existing URL
  bun omega:profile parse "https://profiles.factory-wager.com/cpu/1380/prod/1769674888459_cpu-md-1769674888459.md"

  # Generate 10 tension profile URLs
  bun omega:profile sequence --type tension --env staging --count 10

  # Get latest CPU profile
  bun omega:profile latest cpu prod

  # Validate URL convention
  bun omega:profile validate "https://profiles.factory-wager.com/cpu/1380/prod/1769674888459_cpu-md-1769674888459.md"

  # Create badge for matrix display
  bun omega:profile badge "https://profiles.factory-wager.com/cpu/1380/prod/1769674888459_cpu-md-1769674888459.md"

OPTIONS:
  --type         Profile type (cpu, heap, tension, memory, performance)
  --env          Environment (prod, staging, canary, dev, unknown)
  --timestamp    Unix timestamp (default: current time)
  --team         Team name for metadata
  --benchmark    Benchmark name for metadata
  --format       Output format (md, json, heapsnapshot)
  --count        Number of profiles to generate (for sequence)
  --validate     Validate URL convention
  --help         Show help

URL PATTERN:
  https://profiles.factory-wager.com/{type}/{tier}/{environment}/{timestamp}_{type}-{timestamp}.{format}
`);
	}
}

// CLI entry point
if (import.meta.main) {
	const cli = new ProfileCLI();
	cli.run(process.argv.slice(2)).catch(console.error);
}

export default ProfileCLI;
