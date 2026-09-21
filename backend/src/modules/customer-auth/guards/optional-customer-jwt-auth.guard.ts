import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Optional Customer JWT Auth Guard
 * Does not throw an error if token is missing or invalid
 * Simply sets req.user if token is valid
 */
@Injectable()
export class OptionalCustomerJwtAuthGuard extends AuthGuard('customer-jwt') {
  private readonly logger = new Logger(OptionalCustomerJwtAuthGuard.name);

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    this.logger.debug(`Auth header present: ${!!authHeader}`);
    if (authHeader) {
      this.logger.debug(`Auth header value: ${authHeader.substring(0, 30)}...`);
    }

    // Try to validate, but catch any errors
    return Promise.resolve(super.canActivate(context) as Promise<boolean>)
      .then(() => {
        this.logger.debug('JWT validation successful');
        return true;
      })
      .catch((err) => {
        this.logger.debug(`JWT validation failed: ${err.message}`);
        return true; // Allow access even if JWT validation fails
      });
  }

  handleRequest(err: any, user: any, info: any) {
    // Log for debugging
    if (user) {
      this.logger.debug(`Customer authenticated: ${user.id}, type: ${user.type}`);
    } else {
      this.logger.debug('No authenticated customer (guest checkout)');
    }

    // If there's an error or no user, just return null
    // Don't throw an error - allow guest access
    if (err || !user) {
      return null;
    }
    return user;
  }
}
