/**
 * Tier-1380 OMEGA S3 Integration
 * Requester Pays support and enhanced S3 operations for profile storage
 */

import { s3 } from "bun";

export interface S3FileOptions {
  bucket: string;
  requestPayer?: boolean;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface S3WriteOptions extends S3FileOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface S3ProfileData {
  type: 'cpu' | 'heap' | 'tension';
  tier: string;
  environment: string;
  timestamp: number;
  data: string | Buffer;
  metadata?: Record<string, string>;
}

export class OMEGAS3Client {
  private defaultOptions: Partial<S3FileOptions>;

  constructor(defaultOptions: Partial<S3FileOptions> = {}) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * Read profile data from Requester Pays bucket
   */
  async readProfile(key: string, options: S3FileOptions): Promise<string> {
    const file = s3.file(key, {
      ...this.defaultOptions,
      ...options,
      requestPayer: true
    });

    return await file.text();
  }

  /**
   * Write profile data to Requester Pays bucket
   */
  async writeProfile(
    key: string, 
    data: string | Buffer, 
    options: S3WriteOptions
  ): Promise<void> {
    await s3.write(key, data, {
      ...this.defaultOptions,
      ...options,
      requestPayer: true,
      contentType: options.contentType || 'text/markdown'
    });
  }

  /**
   * Write Tier-1380 OMEGA profile with automatic naming
   */
  async writeOMEGAProfile(profileData: S3ProfileData): Promise<string> {
    const { type, tier, environment, timestamp, data, metadata } = profileData;
    
    // Generate OMEGA-standard filename
    const filename = `${timestamp}_${type}-md-${timestamp}.md`;
    const key = `${type}/${tier}/${environment}/${filename}`;

    const options: S3WriteOptions = {
      bucket: this.defaultOptions.bucket || 'profiles.factory-wager.com',
      requestPayer: true,
      contentType: 'text/markdown',
      metadata: {
        type,
        tier,
        environment,
        timestamp: timestamp.toString(),
        ...metadata
      }
    };

    await this.writeProfile(key, data, options);
    return `https://profiles.factory-wager.com/${key}`;
  }

  /**
   * Read Tier-1380 OMEGA profile
   */
  async readOMEGAProfile(url: string): Promise<string> {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const key = pathParts.join('/');
    
    const bucket = urlObj.hostname;
    return await this.readProfile(key, { bucket, requestPayer: true });
  }

  /**
   * Batch upload multiple profiles
   */
  async batchUploadProfiles(profiles: S3ProfileData[]): Promise<string[]> {
    const uploadPromises = profiles.map(profile => 
      this.writeOMEGAProfile(profile)
    );

    return await Promise.all(uploadPromises);
  }

  /**
   * Get profile metadata without downloading full content
   */
  async getProfileMetadata(key: string, options: S3FileOptions): Promise<{
    size: number;
    lastModified: Date;
    contentType: string;
    metadata: Record<string, string>;
  }> {
    const file = s3.file(key, {
      ...this.defaultOptions,
      ...options,
      requestPayer: true
    });

    const stats = await file.stat();
    return {
      size: stats.size,
      lastModified: new Date(stats.mtime),
      contentType: stats.contentType || 'text/plain',
      metadata: stats.metadata || {}
    };
  }

  /**
   * List profiles in a specific path
   */
  async listProfiles(
    prefix: string, 
    options: S3FileOptions
  ): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
    const bucket = options.bucket || this.defaultOptions.bucket;
    
    // Note: This is a simplified implementation
    // In practice, you'd use the AWS S3 ListObjects API
    const file = s3.file(prefix, {
      ...this.defaultOptions,
      ...options,
      requestPayer: true
    });

    try {
      const stats = await file.stat();
      return [{
        key: prefix,
        size: stats.size,
        lastModified: new Date(stats.mtime)
      }];
    } catch {
      return [];
    }
  }

  /**
   * Delete a profile
   */
  async deleteProfile(key: string, options: S3FileOptions): Promise<void> {
    const file = s3.file(key, {
      ...this.defaultOptions,
      ...options,
      requestPayer: true
    });

    await file.delete();
  }

  /**
   * Check if profile exists
   */
  async profileExists(key: string, options: S3FileOptions): Promise<boolean> {
    try {
      await this.getProfileMetadata(key, options);
      return true;
    } catch {
      return false;
    }
  }
}

// OMEGA S3 utilities
export const OMEGAS3 = {
  /**
   * Create S3 client with Requester Pays support
   */
  createClient: (defaultOptions: Partial<S3FileOptions> = {}) => 
    new OMEGAS3Client(defaultOptions),

  /**
   * Upload CPU profile to Requester Pays bucket
   */
  uploadCPUProfile: async (
    profileData: S3ProfileData,
    bucket: string = 'profiles.factory-wager.com'
  ) => {
    const client = OMEGAS3.createClient({ bucket });
    return await client.writeOMEGAProfile({
      ...profileData,
      type: 'cpu'
    });
  },

  /**
   * Upload tension profiles in bulk
   */
  bulkUploadTensionProfiles: async (
    profiles: Array<Omit<S3ProfileData, 'type'>>,
    bucket: string = 'profiles.factory-wager.com'
  ) => {
    const client = OMEGAS3.createClient({ bucket });
    const tensionProfiles = profiles.map(p => ({ ...p, type: 'tension' as const }));
    return await client.batchUploadProfiles(tensionProfiles);
  },

  /**
   * Download profile by URL
   */
  downloadProfile: async (url: string) => {
    const client = OMEGAS3.createClient();
    return await client.readOMEGAProfile(url);
  },

  /**
   * Verify profile exists in S3
   */
  verifyProfile: async (url: string) => {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const key = pathParts.join('/');
    const bucket = urlObj.hostname;
    
    const client = OMEGAS3.createClient({ bucket });
    return await client.profileExists(key, { bucket, requestPayer: true });
  }
};

// Example usage for Tier-1380 OMEGA
export const S3Examples = {
  // Upload CPU profile with Requester Pays
  uploadCPUProfile: async (profileContent: string) => {
    console.log('📤 Uploading CPU profile with Requester Pays');
    
    const profileData: S3ProfileData = {
      type: 'cpu',
      tier: '1380',
      environment: 'prod',
      timestamp: Date.now(),
      data: profileContent,
      metadata: {
        team: 'runtime',
        benchmark: 'cpu-test-1'
      }
    };

    const url = await OMEGAS3.uploadCPUProfile(profileData);
    console.log(`✅ CPU profile uploaded: ${url}`);
    return url;
  },

  // Bulk upload tension profiles
  bulkUploadTensionProfiles: async (profiles: string[]) => {
    console.log('📦 Bulk uploading tension profiles');
    
    const profileData = profiles.map((content, index) => ({
      tier: '1380',
      environment: 'staging',
      timestamp: Date.now() + (index * 1000),
      data: content,
      metadata: {
        benchmark: `tension-test-${index + 1}`
      }
    }));

    const urls = await OMEGAS3.bulkUploadTensionProfiles(profileData);
    console.log(`✅ Uploaded ${urls.length} tension profiles`);
    return urls;
  },

  // Download and verify profile
  downloadAndVerify: async (url: string) => {
    console.log('📥 Downloading and verifying profile');
    
    try {
      const content = await OMEGAS3.downloadProfile(url);
      const exists = await OMEGAS3.verifyProfile(url);
      
      console.log(`✅ Profile downloaded (${content.length} chars)`);
      console.log(`✅ Profile verified: ${exists}`);
      
      return { content, exists };
    } catch (error) {
      console.error('❌ Failed to download profile:', error);
      return null;
    }
  }
};
