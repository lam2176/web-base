import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { HashUtil } from '@shared/utils/hash.util';
import { RefreshTokenExpiredException } from '@shared/exceptions/refresh-token-expired.exception';
import { AdminLoginDto } from './dto/login.dto';
import { AdminRegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoggerService, I18nService } from '@shared';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: LoggerService,
    private i18n: I18nService,
  ) {}

  async register(registerDto: AdminRegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Register attempt for email: ${registerDto.email}`, 'AuthService');

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, registerDto.email),
    });

    if (existingUser) {
      this.logger.warn(`Registration failed: Email already exists - ${registerDto.email}`, 'AuthService');
      throw new ConflictException(this.i18n.t('auth.userAlreadyExists'));
    }

    const hashedPassword = await HashUtil.hash(registerDto.password);

    const [newUser] = await db
      .insert(users)
      .values({
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role,
      })
      .returning();

    const tokens = await this.generateTokens(newUser.id, newUser.email, newUser.role);

    await db
      .update(users)
      .set({ refreshToken: tokens.refreshToken })
      .where(eq(users.id, newUser.id));

    this.logger.log(`User registered successfully: ${newUser.email}`, 'AuthService');

    return {
      ...tokens,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }

  async login(loginDto: AdminLoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`, 'AuthService');

    const user = await db.query.users.findFirst({
      where: eq(users.email, loginDto.email),
    });

    if (!user) {
      this.logger.warn(`Login failed: User not found - ${loginDto.email}`, 'AuthService');
      throw new UnauthorizedException(this.i18n.t('auth.invalidCredentials'));
    }

    const isPasswordValid = await HashUtil.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password - ${loginDto.email}`, 'AuthService');
      throw new UnauthorizedException(this.i18n.t('auth.invalidCredentials'));
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await db.update(users).set({ refreshToken: tokens.refreshToken }).where(eq(users.id, user.id));

    this.logger.log(`User logged in successfully: ${user.email}`, 'AuthService');

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('adminJwt.secret'),
      });

      // Ensure this is an admin token
      if (payload.type === 'customer') {
        throw new UnauthorizedException('Invalid admin refresh token');
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.sub),
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);

      await db
        .update(users)
        .set({ refreshToken: tokens.refreshToken })
        .where(eq(users.id, user.id));

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      // If token expired, throw 440
      if (error.name === 'TokenExpiredError') {
        throw new RefreshTokenExpiredException('Admin refresh token expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number): Promise<void> {
    await db.update(users).set({ refreshToken: null }).where(eq(users.id, userId));
  }

  private async generateTokens(
    userId: number,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email, role, type: 'admin' };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('adminJwt.secret'),
        expiresIn: this.configService.get<string>('adminJwt.accessTokenExpiry') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('adminJwt.secret'),
        expiresIn: this.configService.get<string>('adminJwt.refreshTokenExpiry') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
