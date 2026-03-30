import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly accessTokenExpiresIn = '60m';
  private readonly refreshTokenExpiresIn = '1d';
  private readonly absoluteMaxExpiresIn = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(userId: string): Promise<Omit<User, 'password'> | null> {
    try {
      const user = await this.usersService.findOne(userId);
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
    } catch {
      return null;
    }
    return null;
  }

  private generateAccessToken(payload: Record<string, string>): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.accessTokenExpiresIn,
      algorithm: 'HS256',
    });
  }

  private async generateRefreshToken(
    userId: string,
  ): Promise<{ token: string; expiresAt: Date; absoluteExpiry: Date }> {
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000); // 1 day
    const absoluteExpiry = new Date(
      issuedAt.getTime() + this.absoluteMaxExpiresIn,
    ); // 30 days

    const payload = {
      sub: userId,
      type: 'refresh',
      iat: Math.floor(issuedAt.getTime() / 1000),
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: this.refreshTokenExpiresIn,
      secret: this.configService.get<string>('JWT_SECRET'),
      algorithm: 'HS256',
    });

    // Hash the token before storing (security best practice)
    const hashedToken = await bcrypt.hash(token, 10);

    // Store refresh token in database for tracking (hashed for security)
    await this.refreshTokenRepository.save({
      userId,
      token: hashedToken,
      issuedAt,
      expiresAt,
      absoluteExpiry,
      revokedAt: null,
    });

    return { token, expiresAt, absoluteExpiry };
  }

  async validateRefreshToken(token: string): Promise<string | null> {
    try {
      // Verify JWT signature
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        algorithms: ['HS256'],
      });

      if ((payload as Record<string, unknown>).type !== 'refresh') {
        return null;
      }

      // Get all non-revoked refresh tokens for this user from database
      const refreshTokens = await this.refreshTokenRepository.find({
        where: {
          userId: (payload as Record<string, unknown>).sub as string,
          revokedAt: IsNull(),
        },
      });

      if (!refreshTokens.length) {
        return null;
      }

      // Find the token by comparing hashes (timing-safe comparison)
      let tokenFound = false;
      for (const dbToken of refreshTokens) {
        const isMatch = await bcrypt.compare(token, dbToken.token);
        if (isMatch) {
          // Check if token has expired
          if (new Date() > dbToken.expiresAt) {
            return null;
          }

          // Check if token has exceeded absolute max expiration
          if (new Date() > dbToken.absoluteExpiry) {
            return null;
          }

          tokenFound = true;
          break;
        }
      }

      return tokenFound
        ? ((payload as Record<string, unknown>).sub as string)
        : null;
    } catch {
      return null;
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.generateAccessToken(payload);
    const { token: refreshToken } = await this.generateRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600, // 60 minutes in seconds
      refresh_expires_in: 86400, // 1 day in seconds
      refresh_absolute_expires_in: 2592000, // 30 days in seconds
      token_type: 'Bearer',
    };
  }

  async refresh(refreshToken: string) {
    const userId = await this.validateRefreshToken(refreshToken);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke all old refresh tokens for this user (logout from all devices)
    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    const payload = { email: user.email, sub: user.id };
    const newAccessToken = this.generateAccessToken(payload);

    // Issue new refresh token (sliding window)
    const { token: newRefreshToken } = await this.generateRefreshToken(user.id);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in: 3600,
      refresh_expires_in: 86400,
      token_type: 'Bearer',
    };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    try {
      // Verify JWT to extract user ID
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        algorithms: ['HS256'],
      });

      if ((payload as Record<string, unknown>).sub) {
        await this.refreshTokenRepository.update(
          {
            userId: (payload as Record<string, unknown>).sub as string,
            revokedAt: IsNull(),
          },
          { revokedAt: new Date() },
        );
      }
    } catch {
      // Token is invalid or expired, but we still want to log out
      // This is safe since the token can't be used anyway
    }
  }
}
