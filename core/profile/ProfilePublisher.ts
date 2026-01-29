/**
 * Tier-1380 OMEGA Profile Publisher
 * Standardized profile URL generation and management
 * 
 * URL Pattern: https://profiles.factory-wager.com/{profile-type}/{tier}/{environment}/{timestamp}_{profile-type}-{timestamp}.{format}
 */

export interface ProfileMetadata {
  type: 'cpu' | 'heap' | 'tension' | 'memory' | 'performance';
  tier: string;
  environment: 'prod' | 'staging' | 'canary' | 'dev' | 'unknown';
  timestamp: number;
  format: 'md' | 'json' | 'heapsnapshot';
  team?: string;
  benchmark?: string;
}

export interface ProfileUrl {
  url: string;
  filename: string;
  path: string;
  metadata: ProfileMetadata;
}

export class ProfilePublisher {
  private readonly baseUrl = 'https://profiles.factory-wager.com';
  private readonly defaultTier = '1380';

  /**
   * Generate standardized profile URL
   */
  generateProfileUrl(metadata: Partial<ProfileMetadata>): ProfileUrl {
    const fullMetadata: ProfileMetadata = {
      type: metadata.type || 'cpu',
      tier: metadata.tier || this.defaultTier,
      environment: metadata.environment || 'unknown',
      timestamp: metadata.timestamp || Date.now(),
      format: metadata.format || 'md',
      team: metadata.team,
      benchmark: metadata.benchmark
    };

    const filename = this.generateFilename(fullMetadata);
    const path = this.generatePath(fullMetadata);
    const url = `${this.baseUrl}/${path}`;

    return {
      url,
      filename,
      path,
      metadata: fullMetadata
    };
  }

  /**
   * Generate filename following Tier-1380 OMEGA naming convention
   */
  private generateFilename(metadata: ProfileMetadata): string {
    const { timestamp, type, format } = metadata;
    const typeSuffix = type === 'cpu' ? 'cpu-md' : 
                      type === 'heap' ? 'heap-md' : 
                      `${type}-md`;
    
    return `${timestamp}_${typeSuffix}-${timestamp}.${format}`;
  }

  /**
   * Generate path component of URL
   */
  private generatePath(metadata: ProfileMetadata): string {
    const { type, tier, environment } = metadata;
    const filename = this.generateFilename(metadata);
    return `${type}/${tier}/${environment}/${filename}`;
  }

  /**
   * Parse existing profile URL to extract metadata
   */
  parseProfileUrl(url: string): ProfileMetadata | null {
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes('profiles.factory-wager.com')) {
        return null;
      }

      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length < 4) return null;

      const [type, tier, environment, filename] = pathParts;
      
      // Parse filename to extract timestamp and format
      const filenameMatch = filename.match(/^(\d+)_(\w+-\w+)-(\d+)\.(.+)$/);
      if (!filenameMatch) return null;

      const [, timestamp, , , format] = filenameMatch;
      const ts = parseInt(timestamp, 10);

      return {
        type: type as ProfileMetadata['type'],
        tier,
        environment: environment as ProfileMetadata['environment'],
        timestamp: ts,
        format: format as ProfileMetadata['format']
      };
    } catch {
      return null;
    }
  }

  /**
   * Generate profile URL sequence for benchmarks
   */
  generateProfileSequence(
    type: ProfileMetadata['type'],
    count: number,
    environment: ProfileMetadata['environment'] = 'prod',
    startTimestamp?: number
  ): ProfileUrl[] {
    const sequence: ProfileUrl[] = [];
    const startTs = startTimestamp || Date.now();
    
    for (let i = 0; i < count; i++) {
      const timestamp = startTs + (i * 1000); // 1 second intervals
      const profileUrl = this.generateProfileUrl({
        type,
        timestamp,
        environment,
        benchmark: `${type}-benchmark-${i + 1}`
      });
      sequence.push(profileUrl);
    }

    return sequence;
  }

  /**
   * Get latest profile URL for a given type and environment
   */
  async getLatestProfile(
    type: ProfileMetadata['type'],
    environment: ProfileMetadata['environment'] = 'prod'
  ): Promise<ProfileUrl | null> {
    // In a real implementation, this would query the profile storage
    // For now, generate a "latest" URL with current timestamp
    return this.generateProfileUrl({
      type,
      environment,
      benchmark: 'latest'
    });
  }

  /**
   * Create profile link badge for matrix display
   */
  createProfileBadge(profileUrl: ProfileUrl): string {
    const { type, environment } = profileUrl.metadata;
    const emoji = type === 'cpu' ? '🔥' : 
                  type === 'heap' ? '📊' : 
                  type === 'tension' ? '⚡' : '📈';
    
    const envColor = environment === 'prod' ? '' : 
                     environment === 'staging' ? '🟡' : 
                     environment === 'canary' ? '🟠' : '⚪';
    
    return `${emoji}${envColor}`;
  }

  /**
   * Validate profile URL follows Tier-1380 OMEGA convention
   */
  validateProfileUrl(url: string): boolean {
    const metadata = this.parseProfileUrl(url);
    if (!metadata) return false;

    // Check naming invariants
    const expectedFilename = this.generateFilename(metadata);
    const expectedPath = this.generatePath(metadata);
    
    return url.includes(expectedFilename) && url.includes(expectedPath);
  }
}

// Singleton instance
export const profilePublisher = new ProfilePublisher();

// CLI helper functions
export function generateProfileUrlCli(args: string[]): ProfileUrl {
  const [type, environment = 'prod', timestamp] = args;
  return profilePublisher.generateProfileUrl({
    type: type as ProfileMetadata['type'],
    environment: environment as ProfileMetadata['environment'],
    timestamp: timestamp ? parseInt(timestamp, 10) : Date.now()
  });
}

export function parseProfileUrlCli(url: string): string {
  const metadata = profilePublisher.parseProfileUrl(url);
  return metadata ? JSON.stringify(metadata, null, 2) : 'Invalid profile URL';
}

export function generateSequenceCli(type: string, count: string): ProfileUrl[] {
  return profilePublisher.generateProfileSequence(
    type as ProfileMetadata['type'],
    parseInt(count, 10)
  );
}
