import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for expired refresh tokens
 * Uses 440 status code to indicate that the client should redirect to login
 */
export class RefreshTokenExpiredException extends HttpException {
  constructor(message: string = 'Refresh token expired') {
    super(message, 440);
  }
}
