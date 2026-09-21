import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CustomerAuthService } from '../customer-auth.service';

/**
 * Customer JWT Strategy
 * Used for authenticating customer users
 * Strategy name: 'customer-jwt'
 */
@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  private readonly logger = new Logger(CustomerJwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private customerAuthService: CustomerAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('customerJwt.secret'),
    });

    this.logger.log(`Customer JWT Strategy initialized with secret: ${configService.get<string>('customerJwt.secret')?.substring(0, 10)}...`);
  }

  async validate(payload: any) {
    this.logger.debug(`Validating customer token payload: ${JSON.stringify(payload)}`);

    // Validate that this is a customer token
    if (!payload || payload.type !== 'customer') {
      this.logger.warn(`Invalid customer token type: ${payload?.type}`);
      throw new UnauthorizedException('Invalid customer token');
    }

    // Validate customer exists and is active
    const customer = await this.customerAuthService.validateCustomer(payload.sub);
    if (!customer) {
      this.logger.warn(`Customer not found or inactive: ${payload.sub}`);
      throw new UnauthorizedException('Customer not found or inactive');
    }

    this.logger.debug(`Customer validated successfully: ${customer.id}`);
    return {
      ...customer,
      type: 'customer',
    };
  }
}
