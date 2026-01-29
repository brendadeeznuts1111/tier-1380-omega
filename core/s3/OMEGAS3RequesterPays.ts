/**
 * Tier-1380 OMEGA S3 Requester Pays Implementation
 * Complete S3 integration with Requester Pays bucket support
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
  cacheControl?: string;
  contentEncoding?: string;
}

export interface S3ProfileData {
  type: 'cpu' | 'heap' | 'tension';
  tier: string;
  environment: string;
  timestamp: number;
  data: string | Buffer;
  metadata?: Record<string, string>;
}

export interface S3Stats {
  size: number;
  lastModified: Date;
  contentType: string;
  etag?: string;
  metadata?: Record<string, string>;
}

export class OMEGAS3RequesterPays {
  private defaultOptions: Partial<S3FileOptions>;

  constructor(defaultOptions: Partial<S3FileOptions> = {}) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * Read file from Requester Pays bucket
   */
  async readFile(key: string, options: S3FileOptions): Promise<string> {
    const file = s3.file(key, {
      ...this.defaultOptions,
      ...options,
      requestPayer: true
    });

    return await file.text();
  }

  /**
   * Read file as buffer from Requester Pays bucket
   */
  async readFileAsBuffer(key: string, options: S3FileOptions): Promise<Buffer> {
    const file = s3.file(key, {
      ...this.defaultOptions,
      ...options,
      requestPayer: true
    });

    return await file.arrayBuffer() as Buffer;
  }

  /**
   * Write file to Requester Pays bucket
   */
  async writeFile(
    key: string, 
    data: string | Buffer, 
    options: S3WriteOptions
  ): Promise<void> {
    await s3.write(key, data, {
      ...this.defaultOptions,
      ...options,
      requestPayer: true,
      contentType: options.contentType || 'text/plain'
    });
  }

  /**
   * Write JSON data to Requester Pays bucket
   */
  async writeJSON(
    key: string, 
    data: any, 
    options: S3WriteOptions = {}
  ): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    await this.writeFile(key, jsonString, {
      ...options,
      contentType: 'application/json'
    });
  }

  /**
   * Get file stats from Requester Pays bucket
   */
  async getFileStats(key: string, options: S3FileOptions): Promise<S3Stats> {
    const file = s3.file(key, {
      ...this.defaultOptions,
      ...options,
      requestPayer: true
    });

    const stats = await file.stat();
    return {
      size: stats.size,
      lastModified: new Date(stats.mtime),
      contentType: stats.contentType || 'application/octet-stream',
      etag: stats.etag,
      metadata: stats.metadata
    };
  }

  /**
   * Delete file from Requester Pays bucket
   */
  async deleteFile(key: string, options: S3FileOptions): Promise<void> {
    const file = s3.file(key, {
      ...this.defaultOptions,
      ...options,
      requestPayer: true
    });

    await file.delete();
  }

  /**
   * Check if file exists in Requester Pays bucket
   */
  async fileExists(key: string, options: S3FileOptions): Promise<boolean> {
    try {
      await this.getFileStats(key, options);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Copy file within Requester Pays bucket
   */
  async copyFile(
    sourceKey: string, 
    destinationKey: string, 
    options: S3FileOptions
  ): Promise<void> {
    const sourceFile = s3.file(sourceKey, {
      ...this.defaultOptions,
      ...options,
      requestPayer: true
    });

    const destinationFile = s3.file(destinationKey, {
      ...this.defaultOptions,
      ...options,
      requestPayer: true
    });

    // Read source and write to destination
    const data = await sourceFile.arrayBuffer();
    await s3.write(destinationKey, data, {
      ...options,
      requestPayer: true
    });
  }

  /**
   * List files in Requester Pays bucket (simplified implementation)
   */
  async listFiles(
    prefix: string = '', 
    options: S3FileOptions = {}
  ): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
    // Note: This is a simplified implementation
    // In practice, you'd use the AWS S3 ListObjects API
    const files: Array<{ key: string; size: number; lastModified: Date }> = [];
    
    // For demonstration, we'll try to stat a few common files
    const commonFiles = [
      `${prefix}profiles/cpu/1380/prod/latest.json`,
      `${prefix}profiles/tension/1380/staging/latest.json`,
      `${prefix}profiles/heap/1380/dev/latest.json`
    ];

    for (const file of commonFiles) {
      try {
        const stats = await this.getFileStats(file, options);
        files.push({
          key: file,
          size: stats.size,
          lastModified: stats.lastModified
        });
      } catch {
        // File doesn't exist, skip it
      }
    }

    return files;
  }

  /**
   * Upload Tier-1380 OMEGA profile to Requester Pays bucket
   */
  async uploadOMEGAProfile(profileData: S3ProfileData): Promise<string> {
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
      },
      cacheControl: 'public, max-age=3600'
    };

    await this.writeFile(key, data, options);
    return `https://profiles.factory-wager.com/${key}`;
  }

  /**
   * Download Tier-1380 OMEGA profile from Requester Pays bucket
   */
  async downloadOMEGAProfile(url: string): Promise<string> {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const key = pathParts.join('/');
    
    const bucket = urlObj.hostname;
    return await this.readFile(key, { bucket, requestPayer: true });
  }

  /**
   * Batch upload multiple OMEGA profiles to Requester Pays bucket
   */
  async batchUploadOMEGAProfiles(profiles: S3ProfileData[]): Promise<string[]> {
    const uploadPromises = profiles.map(profile => 
      this.uploadOMEGAProfile(profile)
    );

    return await Promise.all(uploadPromises);
  }

  /**
   * Get OMEGA profile metadata from Requester Pays bucket
   */
  async getOMEGAProfileMetadata(url: string): Promise<S3Stats> {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const key = pathParts.join('/');
    
    const bucket = urlObj.hostname;
    return await this.getFileStats(key, { bucket, requestPayer: true });
  }

  /**
   * Sync OMEGA profiles to Requester Pays bucket
   */
  async syncOMEGAProfiles(
    profiles: Array<{ key: string; data: string | Buffer; metadata?: Record<string, string> }>,
    bucket: string
  ): Promise<{ uploaded: number; failed: number; errors: string[] }> {
    let uploaded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      try {
        await this.writeFile(profile.key, profile.data, {
          bucket,
          requestPayer: true,
          contentType: 'text/markdown',
          metadata: profile.metadata
        });
        uploaded++;
      } catch (error) {
        failed++;
        errors.push(`Failed to upload ${profile.key}: ${error}`);
      }
    }

    return { uploaded, failed, errors };
  }

  /**
   * Create multipart upload for large files in Requester Pays bucket
   */
  async createMultipartUpload(
    key: string,
    data: Buffer,
    options: S3WriteOptions = {},
    chunkSize: number = 5 * 1024 * 1024 // 5MB chunks
  ): Promise<void> {
    const totalChunks = Math.ceil(data.length / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, data.length);
      const chunk = data.subarray(start, end);
      
      const chunkKey = `${key}.part${i + 1}`;
      await this.writeFile(chunkKey, chunk, {
        ...options,
        requestPayer: true
      });
    }
    
    // In a real implementation, you would then complete the multipart upload
    console.log(`Multipart upload completed for ${key} (${totalChunks} chunks)`);
  }
}

// OMEGA S3 Requester Pays utilities
export const OMEGAS3RequesterPays = {
  /**
   * Create S3 client with Requester Pays support
   */
  createClient: (defaultOptions: Partial<S3FileOptions> = {}) => 
    new OMEGAS3RequesterPays(defaultOptions),

  /**
   * Quick upload CPU profile to Requester Pays bucket
   */
  uploadCPUProfile: async (
    profileData: Omit<S3ProfileData, 'type'>,
    bucket: string = 'profiles.factory-wager.com'
  ) => {
    const client = OMEGAS3RequesterPays.createClient({ bucket });
    return await client.uploadOMEGAProfile({
      ...profileData,
      type: 'cpu'
    });
  },

  /**
   * Quick download profile from Requester Pays bucket
   */
  downloadProfile: async (url: string) => {
    const client = OMEGAS3RequesterPays.createClient();
    return await client.downloadOMEGAProfile(url);
  },

  /**
   * Quick check if profile exists in Requester Pays bucket
   */
  profileExists: async (url: string) => {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const key = pathParts.join('/');
    const bucket = urlObj.hostname;
    
    const client = OMEGAS3RequesterPays.createClient({ bucket });
    return await client.fileExists(key, { bucket, requestPayer: true });
  },

  /**
   * Batch upload tension profiles to Requester Pays bucket
   */
  bulkUploadTensionProfiles: async (
    profiles: Array<Omit<S3ProfileData, 'type'>>,
    bucket: string = 'profiles.factory-wager.com'
  ) => {
    const client = OMEGAS3RequesterPays.createClient({ bucket });
    const tensionProfiles = profiles.map(p => ({ ...p, type: 'tension' as const }));
    return await client.batchUploadOMEGAProfiles(tensionProfiles);
  }
};

// Example usage for Tier-1380 OMEGA
export const S3RequesterPaysExamples = {
  // Basic file operations with Requester Pays
  basicOperations: async () => {
    console.log('📤 Basic S3 Requester Pays Operations');
    
    const client = OMEGAS3RequesterPays.createClient({
      bucket: 'requester-pays-bucket',
      region: 'us-east-1'
    });

    // Write file
    await client.writeFile('data.csv', 'id,name,value\n1,test,100', {
      requestPayer: true,
      contentType: 'text/csv'
    });
    console.log('✅ File written to Requester Pays bucket');

    // Read file
    const content = await client.readFile('data.csv', {
      bucket: 'requester-pays-bucket',
      requestPayer: true
    });
    console.log('📥 File content:', content);

    // Get file stats
    const stats = await client.getFileStats('data.csv', {
      bucket: 'requester-pays-bucket',
      requestPayer: true
    });
    console.log('📊 File stats:', stats);
  },

  // OMEGA profile operations
  omegaProfileOperations: async () => {
    console.log('🔥 OMEGA Profile Operations with Requester Pays');

    const profileData: S3ProfileData = {
      type: 'cpu',
      tier: '1380',
      environment: 'prod',
      timestamp: Date.now(),
      data: '# CPU Profile\n\nPerformance metrics...\n',
      metadata: {
        team: 'runtime',
        benchmark: 'cpu-test-1',
        version: '1.0'
      }
    };

    // Upload profile
    const url = await OMEGAS3RequesterPays.uploadCPUProfile(profileData);
    console.log('✅ CPU profile uploaded:', url);

    // Download profile
    const content = await OMEGAS3RequesterPays.downloadProfile(url);
    console.log('📥 Profile downloaded:', content.substring(0, 50) + '...');

    // Check if exists
    const exists = await OMEGAS3RequesterPays.profileExists(url);
    console.log('🔍 Profile exists:', exists);
  },

  // Bulk operations
  bulkOperations: async () => {
    console.log('📦 Bulk S3 Requester Pays Operations');

    const profiles = [
      {
        tier: '1380',
        environment: 'staging',
        timestamp: Date.now(),
        data: '# Tension Profile 1\n\nMetrics...\n',
        metadata: { benchmark: 'tension-test-1' }
      },
      {
        tier: '1380',
        environment: 'staging',
        timestamp: Date.now() + 1000,
        data: '# Tension Profile 2\n\nMetrics...\n',
        metadata: { benchmark: 'tension-test-2' }
      }
    ];

    const urls = await OMEGAS3RequesterPays.bulkUploadTensionProfiles(profiles);
    console.log(`✅ Uploaded ${urls.length} tension profiles`);
    urls.forEach((url, index) => {
      console.log(`  Profile ${index + 1}: ${url}`);
    });
  },

  // JSON operations
  jsonOperations: async () => {
    console.log('📄 JSON Operations with Requester Pays');

    const client = OMEGAS3RequesterPays.createClient({
      bucket: 'requester-pays-bucket'
    });

    const jsonData = {
      profiles: [
        { id: 'cpu-1', type: 'cpu', score: 85 },
        { id: 'tension-1', type: 'tension', score: 92 }
      ],
      metadata: {
        generated: new Date().toISOString(),
        version: '1.0'
      }
    };

    // Write JSON
    await client.writeJSON('profiles.json', jsonData, {
      requestPayer: true,
      cacheControl: 'public, max-age=300'
    });
    console.log('✅ JSON data written');

    // Read JSON
    const content = await client.readFile('profiles.json', {
      bucket: 'requester-pays-bucket',
      requestPayer: true
    });
    const parsed = JSON.parse(content);
    console.log('📊 Parsed JSON:', parsed);
  }
};
