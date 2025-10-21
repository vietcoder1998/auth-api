
import { PrismaClient } from '@prisma/client';
import * as env from '../env';

const prisma = new PrismaClient();

export interface CreateConfigData {
  key: string;
  value: string;
}

export interface UpdateConfigData {
  value: string;
}

export class ConfigService {
  /**
   * Set configuration value
   */
  async setConfig(key: string, value: string) {
    const config = await prisma.config.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return config;
  }

  /**
   * Get configuration value by key
   */
  async getConfig(key: string) {
    const config = await prisma.config.findUnique({
      where: { key },
    });

    return config?.value || null;
  }

  /**
   * Get configuration object by key
   */
  async getConfigObject(key: string) {
    const config = await prisma.config.findUnique({
      where: { key },
    });

    if (!config) {
      return null;
    }

    return config;
  }

  /**
   * Get multiple configuration values
   */
  async getConfigs(keys: string[]) {
    const configs = await prisma.config.findMany({
      where: {
        key: { in: keys },
      },
    });

    // Convert to key-value object
    const configMap: Record<string, string> = {};
    configs.forEach((config) => {
      configMap[config.key] = config.value;
    });

    return configMap;
  }

  /**
   * Get all configurations
   */
  async getAllConfigs() {
    const configs = await prisma.config.findMany({
      orderBy: { key: 'asc' },
    });

    return configs;
  }

  /**
   * Update configuration value
   */
  async updateConfig(key: string, value: string) {
    const config = await prisma.config.update({
      where: { key },
      data: { value },
    });

    return config;
  }

  /**
   * Delete configuration
   */
  async deleteConfig(key: string) {
    return await prisma.config.delete({
      where: { key },
    });
  }

  /**
   * Set multiple configurations
   */
  async setConfigs(configs: Record<string, string>) {
    const operations = Object.entries(configs).map(([key, value]) =>
      prisma.config.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    );

    const results = await Promise.all(operations);
    return results;
  }

  /**
   * Get configuration as boolean
   */
  async getConfigBoolean(key: string, defaultValue: boolean = false): Promise<boolean> {
    const value = await this.getConfig(key);
    if (value === null) return defaultValue;

    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Get configuration as number
   */
  async getConfigNumber(key: string, defaultValue: number = 0): Promise<number> {
    const value = await this.getConfig(key);
    if (value === null) return defaultValue;

    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get configuration as JSON
   */
  async getConfigJSON(key: string, defaultValue: any = null): Promise<any> {
    const value = await this.getConfig(key);
    if (value === null) return defaultValue;

    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Set configuration as JSON
   */
  async setConfigJSON(key: string, value: any) {
    return await this.setConfig(key, JSON.stringify(value));
  }

  /**
   * Check if configuration exists
   */
  async configExists(key: string): Promise<boolean> {
    const config = await prisma.config.findUnique({
      where: { key },
      select: { key: true },
    });

    return config !== null;
  }

  /**
   * Get configurations by prefix
   */
  async getConfigsByPrefix(prefix: string) {
    const configs = await prisma.config.findMany({
      where: {
        key: {
          startsWith: prefix,
        },
      },
      orderBy: { key: 'asc' },
    });

    return configs;
  }

  /**
   * Bulk update configurations
   */
  async bulkUpdateConfigs(updates: { key: string; value: string }[]) {
    const operations = updates.map(({ key, value }) =>
      prisma.config.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    );

    const results = await Promise.all(operations);
    return results;
  }

  /**
   * Get system settings (common configuration patterns)
   */
  async getSystemSettings() {
    const settings = await this.getConfigsByPrefix('system.');

    const settingsMap: Record<string, any> = {};
    settings.forEach((config) => {
      const key = config.key.replace('system.', '');

      // Try to parse as JSON, fallback to string
      try {
        settingsMap[key] = JSON.parse(config.value);
      } catch {
        settingsMap[key] = config.value;
      }
    });

    return settingsMap;
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(settings: Record<string, any>) {
    const updates = Object.entries(settings).map(([key, value]) => ({
      key: `system.${key}`,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }));

    return await this.bulkUpdateConfigs(updates);
  }

  /**
   * Get application settings
   */
  async getAppSettings() {
    const settings = await this.getConfigsByPrefix('app.');

    const settingsMap: Record<string, any> = {};
    settings.forEach((config) => {
      const key = config.key.replace('app.', '');

      // Try to parse as JSON, fallback to string
      try {
        settingsMap[key] = JSON.parse(config.value);
      } catch {
        settingsMap[key] = config.value;
      }
    });

    return settingsMap;
  }

  /**
   * Update application settings
   */
  async updateAppSettings(settings: Record<string, any>) {
    const updates = Object.entries(settings).map(([key, value]) => ({
      key: `app.${key}`,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }));

    return await this.bulkUpdateConfigs(updates);
  }

  /**
   * Reset configuration to default
   */
  async resetConfig(key: string, defaultValue: string) {
    return await this.setConfig(key, defaultValue);
  }

  /**
   * Export all configurations
   */
  async exportConfigs() {
    const configs = await this.getAllConfigs();

    const exportData: Record<string, string> = {};
    configs.forEach((config) => {
      exportData[config.key] = config.value;
    });

    return exportData;
  }

  /**
   * Import configurations
   */
  async importConfigs(configs: Record<string, string>, overwrite: boolean = false) {
    const operations = [];

    for (const [key, value] of Object.entries(configs)) {
      if (overwrite) {
        operations.push(
          prisma.config.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          }),
        );
      } else {
        // Only create if doesn't exist
        operations.push(
          prisma.config.upsert({
            where: { key },
            update: {}, // No update
            create: { key, value },
          }),
        );
      }
    }

    const results = await Promise.all(operations);
    return results;
  }

    /**
   * Get allowed origins for CORS
   */
  async getAllowedOrigins(): Promise<string[]> {
    try {
      const configs = await prisma.config.findMany({ where: { key: 'cors_origin' } });
      if (configs && configs.length > 0) {
        return configs.map((c) => c.value);
      }
      // Fallback to env or default
      const envOrigins = (env.CORS_ORIGIN || '').split(',').filter(Boolean);
      return envOrigins.length > 0 ? envOrigins : ['http://localhost:5173'];
    } catch (err) {
      return ['http://localhost:5173'];
    }
  }
}

export const configService = new ConfigService();
