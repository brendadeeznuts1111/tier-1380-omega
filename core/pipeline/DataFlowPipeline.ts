/**
 * Tier-1380 OMEGA Data Flow Pipeline
 * RSS → Blog → Matrix → Profile integration
 */

import { matrixRegistry } from "../matrix/MatrixRegistry.ts";
import { profilePublisher } from "../profile/ProfilePublisher.ts";

export interface RSSItem {
	title: string;
	link: string;
	description: string;
	category: string;
	pubDate: string;
	guid: string;
	team?: string;
	tier?: string;
}

export interface BlogPost {
	id: string;
	title: string;
	content: string;
	author: string;
	team: string;
	tier: string;
	timestamp: number;
	profileUrl?: string;
	metadata: {
		wordCount: number;
		readingTime: number;
		tags: string[];
	};
}

export interface MatrixRow {
	column: number;
	row: number;
	team: string;
	value: any;
	profileUrl?: string;
	badge?: string;
	timestamp: number;
}

export class DataFlowPipeline {
	private readonly tier = "1380";
	private readonly teamColumnMapping = {
		runtime: { startCol: 1, endCol: 20 },
		compiler: { startCol: 21, endCol: 40 },
		platform: { startCol: 41, endCol: 60 },
	};

	/**
	 * Process RSS item through complete pipeline
	 */
	async processRSSItem(rssItem: RSSItem): Promise<{
		blogPost: BlogPost;
		matrixRow: MatrixRow;
		profileUrl: string;
	}> {
		// Step 1: Create blog post from RSS item
		const blogPost = this.createBlogPostFromRSS(rssItem);

		// Step 2: Transform blog post to matrix row
		const matrixRow = this.blogPostToMatrixRow(blogPost);

		// Step 3: Generate profile URL
		const profileUrl = this.generateProfileUrlForPost(blogPost);

		// Step 4: Update matrix registry
		matrixRegistry.addCellWithProfile(
			matrixRow.column,
			matrixRow.row,
			matrixRow.value,
			this.getProfileTypeForTeam(blogPost.team),
			"prod",
		);

		// Step 5: Update blog post with profile URL
		blogPost.profileUrl = profileUrl.url;

		return {
			blogPost,
			matrixRow,
			profileUrl: profileUrl.url,
		};
	}

	/**
	 * Create blog post from RSS item
	 */
	private createBlogPostFromRSS(rssItem: RSSItem): BlogPost {
		const team = rssItem.team || this.extractTeamFromCategory(rssItem.category);
		const content = this.enhanceContent(rssItem.description, team);

		return {
			id: rssItem.guid,
			title: rssItem.title,
			content,
			author: this.extractAuthorFromRSS(rssItem),
			team,
			tier: rssItem.tier || this.tier,
			timestamp: new Date(rssItem.pubDate).getTime(),
			metadata: {
				wordCount: content.split(/\s+/).length,
				readingTime: Math.ceil(content.split(/\s+/).length / 200), // 200 wpm
				tags: this.extractTagsFromRSS(rssItem),
			},
		};
	}

	/**
	 * Transform blog post to matrix row
	 */
	private blogPostToMatrixRow(post: BlogPost): MatrixRow {
		const column = this.getColumnForTeam(post.team);
		const row = this.getRowForPost(post);

		return {
			column,
			row,
			team: post.team,
			value: {
				postId: post.id,
				title: post.title,
				author: post.author,
				wordCount: post.metadata.wordCount,
				tags: post.metadata.tags,
				engagement: this.calculateEngagement(post),
			},
			timestamp: post.timestamp,
		};
	}

	/**
	 * Generate profile URL for blog post
	 */
	private generateProfileUrlForPost(post: BlogPost) {
		return profilePublisher.generateProfileUrl({
			type: this.getProfileTypeForTeam(post.team),
			tier: post.tier,
			environment: "prod",
			timestamp: post.timestamp,
			team: post.team,
			benchmark: `${post.team}-${post.id}`,
		});
	}

	/**
	 * Extract team from RSS category
	 */
	private extractTeamFromCategory(category: string): string {
		const categoryLower = category.toLowerCase();
		if (
			categoryLower.includes("runtime") ||
			categoryLower.includes("performance")
		) {
			return "runtime";
		}
		if (categoryLower.includes("compiler") || categoryLower.includes("build")) {
			return "compiler";
		}
		if (
			categoryLower.includes("platform") ||
			categoryLower.includes("system")
		) {
			return "platform";
		}
		return "runtime"; // default
	}

	/**
	 * Enhance content with team-specific context
	 */
	private enhanceContent(description: string, team: string): string {
		const teamContext = {
			runtime:
				"This runtime optimization impacts Air IR performance and buffer management.",
			compiler:
				"This compiler enhancement affects code generation and optimization passes.",
			platform:
				"This platform improvement influences boot time and system integration.",
		};

		return `${description}\n\n${teamContext[team as keyof typeof teamContext]}`;
	}

	/**
	 * Extract author from RSS item
	 */
	private extractAuthorFromRSS(rssItem: RSSItem): string {
		// Try to extract from description or use team-based default
		const authorMatch = rssItem.description.match(/by\s+(\w+)/i);
		if (authorMatch) return authorMatch[1];

		const team = this.extractTeamFromCategory(rssItem.category);
		return `${team}-lead`;
	}

	/**
	 * Extract tags from RSS item
	 */
	private extractTagsFromRSS(rssItem: RSSItem): string[] {
		const tags = new Set<string>();

		// Add category as tag
		tags.add(rssItem.category.toLowerCase());

		// Extract keywords from title
		const keywords = [
			"performance",
			"optimization",
			"memory",
			"speed",
			"air",
			"ir",
			"buffer",
		];
		keywords.forEach((keyword) => {
			if (rssItem.title.toLowerCase().includes(keyword)) {
				tags.add(keyword);
			}
		});

		return Array.from(tags);
	}

	/**
	 * Get column for team
	 */
	private getColumnForTeam(team: string): number {
		const mapping =
			this.teamColumnMapping[team as keyof typeof this.teamColumnMapping];
		if (!mapping) return 1; // default to first column

		// Simple round-robin within team range
		const range = mapping.endCol - mapping.startCol + 1;
		const randomIndex = Math.floor(Math.random() * range);
		return mapping.startCol + randomIndex;
	}

	/**
	 * Get row for post (based on timestamp)
	 */
	private getRowForPost(post: BlogPost): number {
		// Use timestamp to distribute across rows (1-20)
		return ((post.timestamp / 1000) % 20) + 1;
	}

	/**
	 * Get profile type for team
	 */
	private getProfileTypeForTeam(
		team: string,
	): "cpu" | "heap" | "tension" | "memory" | "performance" {
		const mapping: Record<
			string,
			"cpu" | "heap" | "tension" | "memory" | "performance"
		> = {
			runtime: "cpu",
			compiler: "tension",
			platform: "memory",
		};
		return mapping[team] || "cpu";
	}

	/**
	 * Calculate engagement metrics
	 */
	private calculateEngagement(post: BlogPost): number {
		// Simple engagement calculation based on content metrics
		let score = 0;

		// Word count contribution
		score += Math.min(post.metadata.wordCount / 100, 5);

		// Tag diversity
		score += post.metadata.tags.length * 0.5;

		// Team-specific weighting
		if (post.team === "runtime") score += 2; // runtime gets bonus

		return Math.round(score * 10) / 10;
	}

	/**
	 * Process multiple RSS items
	 */
	async processRSSBatch(items: RSSItem[]): Promise<{
		processed: Array<{
			blogPost: BlogPost;
			matrixRow: MatrixRow;
			profileUrl: string;
		}>;
		summary: {
			total: number;
			byTeam: Record<string, number>;
			profilesGenerated: number;
		};
	}> {
		const results = [];
		const summary = {
			total: items.length,
			byTeam: {} as Record<string, number>,
			profilesGenerated: 0,
		};

		for (const item of items) {
			try {
				const result = await this.processRSSItem(item);
				results.push(result);

				// Update summary
				summary.byTeam[result.blogPost.team] =
					(summary.byTeam[result.blogPost.team] || 0) + 1;
				summary.profilesGenerated++;
			} catch (error) {
				console.error(`Failed to process RSS item: ${item.title}`, error);
			}
		}

		return { processed: results, summary };
	}

	/**
	 * Get pipeline statistics
	 */
	getPipelineStats(): {
		totalPosts: number;
		postsWithProfiles: number;
		matrixCoverage: number;
		teamDistribution: Record<string, number>;
		profileTypes: Record<string, number>;
	} {
		const matrixStats = matrixRegistry.getStatistics();

		return {
			totalPosts: matrixStats.cellsWithProfiles,
			postsWithProfiles: matrixStats.cellsWithProfiles,
			matrixCoverage: matrixStats.coverage,
			teamDistribution: matrixStats.profilesByTeam,
			profileTypes: matrixStats.profilesByType,
		};
	}

	/**
	 * Export pipeline state
	 */
	exportPipelineState(): string {
		return JSON.stringify(
			{
				timestamp: Date.now(),
				tier: this.tier,
				teamColumnMapping: this.teamColumnMapping,
				stats: this.getPipelineStats(),
				matrix: matrixRegistry.exportMatrix(),
			},
			null,
			2,
		);
	}
}

// Singleton instance
export const dataFlowPipeline = new DataFlowPipeline();
