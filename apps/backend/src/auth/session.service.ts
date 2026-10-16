import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Request, Response } from 'express';
import { Environment, NodeEnv } from '../config/environment.js';

export const SESSION_COOKIE = 'session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class SessionService {
  private readonly cookieOptions: CookieOptions;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService<Environment, true>,
  ) {
    this.cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.get('NODE_ENV', { infer: true }) === NodeEnv.Production,
      path: '/',
    };
  }

  async start(response: Response, userId: string): Promise<void> {
    const token = await this.jwt.signAsync(
      { sub: userId },
      { expiresIn: SESSION_TTL_SECONDS },
    );
    response.cookie(SESSION_COOKIE, token, {
      ...this.cookieOptions,
      maxAge: SESSION_TTL_SECONDS * 1000,
    });
  }

  clear(response: Response): void {
    response.clearCookie(SESSION_COOKIE, this.cookieOptions);
  }

  async readUserId(request: Request): Promise<string | null> {
    const token: unknown = request.cookies?.[SESSION_COOKIE];
    if (typeof token !== 'string') {
      return null;
    }
    try {
      const { sub } = await this.jwt.verifyAsync<{ sub: unknown }>(token);
      return typeof sub === 'string' ? sub : null;
    } catch {
      return null;
    }
  }
}
