import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Canva Connect API configuration
const CANVA_API_BASE_URL = 'https://api.canva.com/rest/v1';

interface CanvaAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface CanvaAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface CanvaDesign {
  id: string;
  title: string;
  thumbnail?: {
    url: string;
  };
  urls?: {
    edit_url: string;
    view_url: string;
  };
}

interface CanvaTemplate {
  id: string;
  title: string;
  description?: string;
  thumbnail?: {
    url: string;
  };
  tags?: string[];
}

export class CanvaService {
  private config: CanvaAuthConfig;
  private accessToken: string | null = null;

  constructor(config: CanvaAuthConfig) {
    this.config = config;
    this.loadStoredToken();
  }

  private async loadStoredToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('canva_access_token');
      if (token) {
        this.accessToken = token;
      }
    } catch (error) {
      console.error('Error loading stored Canva token:', error);
    }
  }

  private async storeToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('canva_access_token', token);
      this.accessToken = token;
    } catch (error) {
      console.error('Error storing Canva token:', error);
    }
  }

  private async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('canva_access_token');
      this.accessToken = null;
    } catch (error) {
      console.error('Error clearing Canva token:', error);
    }
  }

  private getAuthHeaders() {
    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get OAuth authorization URL for user authentication
   */
  getAuthorizationUrl(state?: string): string {
    const scopes = [
      'design:read',
      'design:write',
      'template:read',
      'folder:read',
      'folder:write'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: scopes,
      ...(state && { state })
    });

    return `https://www.canva.com/api/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<CanvaAccessToken> {
    try {
      const response: AxiosResponse<CanvaAccessToken> = await axios.post(
        'https://api.canva.com/rest/v1/oauth/token',
        {
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      await this.storeToken(response.data.access_token);
      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to authenticate with Canva');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<CanvaAccessToken> {
    try {
      const response: AxiosResponse<CanvaAccessToken> = await axios.post(
        'https://api.canva.com/rest/v1/oauth/token',
        {
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      await this.storeToken(response.data.access_token);
      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh Canva token');
    }
  }

  /**
   * Get user's designs
   */
  async getUserDesigns(limit: number = 10): Promise<CanvaDesign[]> {
    try {
      const response = await axios.get(
        `${CANVA_API_BASE_URL}/designs`,
        {
          headers: this.getAuthHeaders(),
          params: { limit }
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching designs:', error);
      throw new Error('Failed to fetch Canva designs');
    }
  }

  /**
   * Create a new design from template
   */
  async createDesignFromTemplate(templateId: string, title?: string): Promise<CanvaDesign> {
    try {
      const response = await axios.post(
        `${CANVA_API_BASE_URL}/designs`,
        {
          design_type: 'presentation', // or 'logo', 'social_media_post', etc.
          template_id: templateId,
          ...(title && { title })
        },
        {
          headers: this.getAuthHeaders()
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating design from template:', error);
      throw new Error('Failed to create design from Canva template');
    }
  }

  /**
   * Search for templates suitable for barber/salon business
   */
  async searchBarberTemplates(query: string = 'barber salon'): Promise<CanvaTemplate[]> {
    try {
      const response = await axios.get(
        `${CANVA_API_BASE_URL}/templates`,
        {
          headers: this.getAuthHeaders(),
          params: {
            query,
            category: 'business',
            limit: 20
          }
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Error searching templates:', error);
      throw new Error('Failed to search Canva templates');
    }
  }

  /**
   * Get design edit URL for opening in Canva editor
   */
  async getDesignEditUrl(designId: string, returnUrl?: string): Promise<string> {
    try {
      const params = new URLSearchParams();
      if (returnUrl) {
        params.append('return_url', returnUrl);
      }

      const queryString = params.toString();
      return `https://www.canva.com/design/${designId}/edit${queryString ? `?${queryString}` : ''}`;
    } catch (error) {
      console.error('Error generating edit URL:', error);
      throw new Error('Failed to generate Canva edit URL');
    }
  }

  /**
   * Export design as image
   */
  async exportDesignAsImage(designId: string, format: 'jpg' | 'png' = 'png'): Promise<string> {
    try {
      const response = await axios.post(
        `${CANVA_API_BASE_URL}/exports`,
        {
          design_id: designId,
          format: {
            type: format,
            quality: 'standard'
          }
        },
        {
          headers: this.getAuthHeaders()
        }
      );

      // Note: This returns an export job ID. You'd need to poll for completion
      return response.data.job.id;
    } catch (error) {
      console.error('Error exporting design:', error);
      throw new Error('Failed to export Canva design');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    await this.clearToken();
  }
}

// Export a singleton instance
export const canvaService = new CanvaService({
  clientId: process.env.EXPO_PUBLIC_CANVA_CLIENT_ID || '',
  clientSecret: process.env.EXPO_PUBLIC_CANVA_CLIENT_SECRET || '',
  redirectUri: process.env.EXPO_PUBLIC_CANVA_REDIRECT_URI || 'barberbuddy://canva/callback',
});