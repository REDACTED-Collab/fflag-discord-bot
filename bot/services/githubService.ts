import axios from 'axios';
import { config } from '../config';
import { FlagData, FlagMetadata } from '../types';

export class GitHubService {
    private static instance: GitHubService;
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    private constructor() {}

    public static getInstance(): GitHubService {
        if (!GitHubService.instance) {
            GitHubService.instance = new GitHubService();
        }
        return GitHubService.instance;
    }

    private async fetchWithCache(url: string) {
        const cached = this.cache.get(url);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }

        const response = await axios.get(url);
        this.cache.set(url, {
            data: response.data,
            timestamp: Date.now()
        });
        return response.data;
    }

    public async getFlagData(flagName: string): Promise<FlagData | null> {
        try {
            // Search in all platform files first as it's more reliable
            const platformData = await this.searchFlagInPlatforms(flagName);
            if (platformData) {
                return platformData;
            }

            // If not found in platforms, try metadata
            try {
                const metadataPath = this.getFlagMetadataPath(flagName);
                const metadata = await this.fetchWithCache(`${config.GITHUB_API_BASE}/${metadataPath}`);
                return this.processFlagMetadata(metadata, flagName);
            } catch (error) {
                // Ignore metadata fetch errors
                return null;
            }
        } catch (error) {
            console.error('Error fetching flag data:', error);
            return null;
        }
    }

    public async getFlagDataForPlatform(flagName: string, platform: string): Promise<FlagData | null> {
        try {
            const data = await this.fetchWithCache(`${config.GITHUB_API_BASE}/${platform}.json`);
            if (data[flagName] !== undefined) {
                const value = data[flagName];
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                    return {
                        name: flagName,
                        Type: typeof value,
                        Value: value,
                        Platform: platform,
                        LastUpdated: Date.now()
                    };
                }
            }
            return null;
        } catch (error) {
            console.error(`Error fetching flag data for ${flagName} on ${platform}:`, error);
            return null;
        }
    }

    private getFlagMetadataPath(flagName: string): string {
        const prefix = flagName.charAt(0).toUpperCase();
        return `FVariables/FFlag/${prefix}/${flagName}.json`;
    }

    private processFlagMetadata(metadata: FlagMetadata, flagName: string): FlagData {
        const result: FlagData = {
            name: flagName,
            Type: metadata.Type,
            Value: metadata.Value,
            Description: 'Metadata available',
            LastUpdated: Date.now()
        };

        if (metadata.Type === 'Platforms') {
            result.Platform = Object.keys(metadata.Value).find(platform => 
                metadata.Value[platform] !== undefined
            );
        }

        return result;
    }

    private async searchFlagInPlatforms(flagName: string): Promise<FlagData | null> {
        for (const platform of config.PLATFORMS) {
            try {
                const data = await this.fetchWithCache(`${config.GITHUB_API_BASE}/${platform}.json`);
                if (data[flagName] !== undefined) {
                    const value = data[flagName];
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        return {
                            name: flagName,
                            Type: typeof value,
                            Value: value,
                            Platform: platform,
                            LastUpdated: Date.now()
                        };
                    }
                }
            } catch (error) {
                console.error(`Error searching in ${platform}:`, error);
            }
        }
        return null;
    }

    public async getNewFlags(hours: number = 24): Promise<FlagData[]> {
        const newFlags: FlagData[] = [];
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);

        for (const platform of config.PLATFORMS) {
            try {
                const data = await this.fetchWithCache(`${config.GITHUB_API_BASE}/${platform}.json`);
                Object.entries(data).forEach(([flagName, value]) => {
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        newFlags.push({
                            name: flagName,
                            Type: typeof value,
                            Value: value,
                            Platform: platform,
                            LastUpdated: Date.now()
                        });
                    }
                });
            } catch (error) {
                console.error(`Error fetching new flags from ${platform}:`, error);
            }
        }

        return newFlags;
    }

    public async searchFlags(keyword: string, includeStudio: boolean = true): Promise<FlagData[]> {
        const results: FlagData[] = [];
        const platforms = includeStudio ? 
            config.PLATFORMS : 
            config.PLATFORMS.filter(p => !p.includes('Studio'));

        for (const platform of platforms) {
            try {
                const data = await this.fetchWithCache(`${config.GITHUB_API_BASE}/${platform}.json`);
                Object.entries(data).forEach(([flagName, value]) => {
                    if (flagName.toLowerCase().includes(keyword.toLowerCase()) &&
                        (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
                        results.push({
                            name: flagName,
                            Type: typeof value,
                            Value: value,
                            Platform: platform,
                            LastUpdated: Date.now()
                        });
                    }
                });
            } catch (error) {
                console.error(`Error searching flags in ${platform}:`, error);
            }
        }

        return results;
    }
}

export const githubService = GitHubService.getInstance();
