/**
 * Microsoft Clarity Service
 *
 * Handles UX insights from Microsoft Clarity.
 *
 * Note: Clarity doesn't have a public API yet, but provides insights via dashboard.
 * This service provides types and structure for when/if API becomes available.
 *
 * For now, this serves as:
 * 1. Type definitions for Clarity data
 * 2. Placeholder for future API integration
 * 3. Mock data generator for development/testing
 *
 * @see https://clarity.microsoft.com/
 */

import { ClarityInsights } from '../types/analytics';

/**
 * Microsoft Clarity Service Class
 *
 * Currently mock implementation - Clarity doesn't have public API
 */
export class ClarityService {
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Fetch UX insights
   *
   * Note: This is a mock implementation until Clarity releases a public API.
   * In production, you would manually review Clarity dashboard.
   */
  async fetchInsights(
    startDate?: string,
    endDate?: string
  ): Promise<ClarityInsights> {
    // Clarity currently doesn't have a public API
    // Data must be viewed in dashboard: https://clarity.microsoft.com/

    console.warn(
      'Clarity API not available. Please view insights at https://clarity.microsoft.com/\n' +
      `Project ID: ${this.projectId}`
    );

    // Return empty insights
    return this.getEmptyInsights();
  }

  /**
   * Get recording count (mock)
   */
  async getRecordingCount(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    // Mock implementation
    return 0;
  }

  /**
   * Get heatmap data (mock)
   */
  async getHeatmapData(
    page: string
  ): Promise<{
    clicks: Array<{ x: number; y: number; count: number }>;
    scrollDepth: number;
  }> {
    // Mock implementation
    return {
      clicks: [],
      scrollDepth: 0,
    };
  }

  /**
   * Get rage click pages
   */
  async getRageClickPages(limit: number = 10): Promise<Array<{
    page: string;
    rageClicks: number;
    sessions: number;
  }>> {
    // Mock implementation
    return [];
  }

  /**
   * Get dead click pages
   */
  async getDeadClickPages(limit: number = 10): Promise<Array<{
    page: string;
    deadClicks: number;
    sessions: number;
  }>> {
    // Mock implementation
    return [];
  }

  /**
   * Get empty insights object
   */
  private getEmptyInsights(): ClarityInsights {
    return {
      totalSessions: 0,
      recordings: 0,
      avgSessionDuration: 0,
      deadClicks: 0,
      rageClicks: 0,
      excessiveScrolling: 0,
      quickBacks: 0,
      errorClicks: 0,
      topRageClickPages: [],
      topDeadClickPages: [],
      topQuickBackPages: [],
    };
  }

  /**
   * Generate Clarity dashboard URL
   */
  getDashboardUrl(): string {
    return `https://clarity.microsoft.com/projects/view/${this.projectId}/dashboard`;
  }

  /**
   * Generate heatmap URL for a specific page
   */
  getHeatmapUrl(page: string): string {
    const encodedPage = encodeURIComponent(page);
    return `https://clarity.microsoft.com/projects/view/${this.projectId}/heatmaps?url=${encodedPage}`;
  }

  /**
   * Generate recordings URL
   */
  getRecordingsUrl(filters?: {
    page?: string;
    rageClicks?: boolean;
    deadClicks?: boolean;
    errors?: boolean;
  }): string {
    let url = `https://clarity.microsoft.com/projects/view/${this.projectId}/recordings`;

    if (filters) {
      const params = new URLSearchParams();
      if (filters.page) params.set('url', filters.page);
      if (filters.rageClicks) params.set('rageClicks', 'true');
      if (filters.deadClicks) params.set('deadClicks', 'true');
      if (filters.errors) params.set('errors', 'true');

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    return url;
  }
}

/**
 * Factory function to create Clarity service
 */
export function createClarityService(projectId: string): ClarityService {
  if (!projectId) {
    throw new Error('Clarity project ID is required');
  }

  return new ClarityService(projectId);
}

/**
 * Helper function to check if Clarity is properly configured
 */
export function isClarityConfigured(projectId?: string): boolean {
  return !!projectId && projectId.length > 0;
}

/**
 * Get setup instructions
 */
export function getClaritySetupInstructions(): string {
  return `
Microsoft Clarity Setup Instructions:

1. Create a FREE account at https://clarity.microsoft.com/
2. Create a new project for your website
3. Copy the Project ID from Settings
4. Add the Project ID to your analytics settings
5. The tracking script will be automatically added to your site

Clarity provides:
- Session recordings
- Heatmaps (click, scroll, area)
- Rage click detection
- Dead click detection
- Quick back detection
- JavaScript error tracking
- All completely FREE with no limits!

View insights at: https://clarity.microsoft.com/
  `.trim();
}
