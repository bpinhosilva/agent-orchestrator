import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Request,
  Response,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApiTags } from '@nestjs/swagger';
import type {
  Response as ExpressResponse,
  Request as ExpressRequest,
} from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
  }

  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Response() res: ExpressResponse) {
    const data = await this.authService.login(loginDto);

    // Set httpOnly, Secure, SameSite cookies for both tokens
    res.cookie('auth_token', data.access_token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      maxAge: data.expires_in * 1000, // Convert seconds to ms
      path: '/',
    });

    res.cookie('refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      maxAge: data.refresh_expires_in * 1000, // 1 day in ms
      path: '/',
    });

    res.json({ message: 'Logged in successfully' });
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'Refresh token not found' });
    }

    try {
      const data = await this.authService.refresh(refreshToken as string);

      // Set access token as httpOnly cookie (same pattern as login)
      res.cookie('auth_token', data.access_token, {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'strict',
        maxAge: data.expires_in * 1000,
        path: '/',
      });

      // Update refresh token cookie with new token
      res.cookie('refresh_token', data.refresh_token, {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'strict',
        maxAge: data.refresh_expires_in * 1000,
        path: '/',
      });

      return res.json({
        message: 'Token refreshed successfully',
        expires_in: data.expires_in,
        token_type: data.token_type,
      });
    } catch {
      // Clear both cookies on refresh failure
      res.clearCookie('auth_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/' });
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'Invalid or expired refresh token' });
    }
  }

  @Get('me')
  getMe(@Request() req: { user: unknown }) {
    return req.user;
  }

  @Post('logout')
  async logout(
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken = req.cookies?.refresh_token;

    // Revoke refresh token in database
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken as string);
    }

    res.clearCookie('auth_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    res.json({ message: 'Logged out successfully' });
  }
}
