import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Admin JWT Strategy
 * Used for authenticating admin/staff users
 * Strategy name: 'jwt' (default)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('adminJwt.secret'),
    });
  }

  async validate(payload: any) {
    // Validate that this is an admin token
    if (!payload || payload.type === 'customer') {
      throw new UnauthorizedException('Invalid admin token');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      type: 'admin',
    };
  }
}
