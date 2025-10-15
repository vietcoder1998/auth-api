import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SSO Key Validation Utilities
 */
export class SSOValidationUtils {
  
  /**
   * Validates if a given SSO key (either key or ssoKey) exists and is valid
   * @param ssoKey - The SSO key to validate
   * @returns Promise<{ valid: boolean, ssoEntry?: any, matchedKeyType?: string }>
   */
  static async validateSSOKey(ssoKey: string): Promise<{
    valid: boolean;
    ssoEntry?: any;
    matchedKeyType?: 'key' | 'ssoKey';
    error?: string;
  }> {
    try {
      if (!ssoKey || typeof ssoKey !== 'string') {
        return { valid: false, error: 'Invalid SSO key format' };
      }

      // Find SSO entry by either key or ssoKey
      const ssoEntry = await prisma.sSO.findFirst({
        where: { 
          OR: [
            { key: ssoKey },
            { ssoKey: ssoKey }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
              roleId: true,
              status: true,
            },
          },
        },
      });

      if (!ssoEntry) {
        return { valid: false, error: 'SSO key not found' };
      }

      // Check if SSO entry is active
      if (!ssoEntry.isActive) {
        return { valid: false, error: 'SSO entry is inactive' };
      }

      // Check if user is active
      if (ssoEntry.user.status !== 'active') {
        return { valid: false, error: 'User account is not active' };
      }

      // Check if SSO entry has expired
      if (ssoEntry.expiresAt && ssoEntry.expiresAt < new Date()) {
        return { valid: false, error: 'SSO entry has expired' };
      }

      // Determine which key type was matched
      const matchedKeyType = ssoEntry.key === ssoKey ? 'key' : 'ssoKey';

      return { 
        valid: true, 
        ssoEntry, 
        matchedKeyType 
      };
    } catch (error) {
      console.error('[SSO_UTILS] Error validating SSO key:', error);
      return { valid: false, error: 'SSO validation failed' };
    }
  }

  /**
   * Checks if a given ssoKey is unique (not already used)
   * @param ssoKey - The SSO key to check for uniqueness
   * @param excludeId - Optional ID to exclude from the uniqueness check (for updates)
   * @returns Promise<{ unique: boolean, error?: string }>
   */
  static async checkSSOKeyUniqueness(ssoKey: string, excludeId?: string): Promise<{
    unique: boolean;
    error?: string;
  }> {
    try {
      if (!ssoKey || typeof ssoKey !== 'string') {
        return { unique: false, error: 'Invalid SSO key format' };
      }

      const whereClause: any = { ssoKey: ssoKey };
      if (excludeId) {
        whereClause.NOT = { id: excludeId };
      }

      const existingSSO = await prisma.sSO.findFirst({
        where: whereClause,
      });

      return { unique: !existingSSO };
    } catch (error) {
      console.error('[SSO_UTILS] Error checking SSO key uniqueness:', error);
      return { unique: false, error: 'Failed to check SSO key uniqueness' };
    }
  }

  /**
   * Checks if a given primary key is unique (not already used)
   * @param key - The primary key to check for uniqueness
   * @param excludeId - Optional ID to exclude from the uniqueness check (for updates)
   * @returns Promise<{ unique: boolean, error?: string }>
   */
  static async checkPrimaryKeyUniqueness(key: string, excludeId?: string): Promise<{
    unique: boolean;
    error?: string;
  }> {
    try {
      if (!key || typeof key !== 'string') {
        return { unique: false, error: 'Invalid key format' };
      }

      const whereClause: any = { key: key };
      if (excludeId) {
        whereClause.NOT = { id: excludeId };
      }

      const existingSSO = await prisma.sSO.findFirst({
        where: whereClause,
      });

      return { unique: !existingSSO };
    } catch (error) {
      console.error('[SSO_UTILS] Error checking primary key uniqueness:', error);
      return { unique: false, error: 'Failed to check primary key uniqueness' };
    }
  }

  /**
   * Generates a unique SSO key based on URL domain or random string
   * @param url - Optional URL to generate key from domain
   * @returns Promise<string> - Generated unique SSO key
   */
  static async generateUniqueSSOKey(url?: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      let ssoKey: string;

      if (url && attempts === 0) {
        // First attempt: generate from URL domain
        try {
          const urlObj = new URL(url);
          const domain = urlObj.hostname.replace(/\./g, '_').toLowerCase();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          ssoKey = `${domain}_${randomSuffix}`;
        } catch {
          // If URL parsing fails, fall back to random
          ssoKey = Math.random().toString(36).substring(2, 18);
        }
      } else {
        // Generate random SSO key
        ssoKey = Math.random().toString(36).substring(2, 18);
      }

      // Check if this key is unique
      const { unique } = await this.checkSSOKeyUniqueness(ssoKey);
      if (unique) {
        return ssoKey;
      }

      attempts++;
    }

    // If all attempts failed, throw error
    throw new Error('Failed to generate unique SSO key after multiple attempts');
  }
}

/**
 * Middleware helper to extract and validate SSO key from request headers
 * @param headers - Request headers object
 * @returns Promise<{ valid: boolean, ssoKey?: string, ssoEntry?: any, error?: string }>
 */
export async function extractAndValidateSSOKey(headers: any): Promise<{
  valid: boolean;
  ssoKey?: string;
  ssoEntry?: any;
  matchedKeyType?: 'key' | 'ssoKey';
  error?: string;
}> {
  const ssoKey = headers['x-sso-key'] as string;
  
  if (!ssoKey) {
    return { valid: false, error: 'No SSO key provided in x-sso-key header' };
  }

  const validation = await SSOValidationUtils.validateSSOKey(ssoKey);
  
  return {
    valid: validation.valid,
    ssoKey: ssoKey,
    ssoEntry: validation.ssoEntry,
    matchedKeyType: validation.matchedKeyType,
    error: validation.error,
  };
}