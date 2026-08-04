import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_CLIENT_ID } from '../../config/config';
import { UnauthorizedException } from '../exceptions';

export interface GoogleProfile {
  email: string;
  firstName: string;
  lastName: string;
  googleId: string;
  avatarUrl?: string;
}

class GoogleAuthService {
  private readonly client = new OAuth2Client(GOOGLE_CLIENT_ID);

  async verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email) {
        throw new UnauthorizedException('Invalid Google token');
      }

      return {
        email: payload.email.toLowerCase(),
        firstName: payload.given_name || payload.name?.split(' ')[0] || 'Google',
        lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || 'User',
        googleId: payload.sub,
        avatarUrl: payload.picture,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid Google token', error);
    }
  }
}

export const googleAuthService = new GoogleAuthService();
