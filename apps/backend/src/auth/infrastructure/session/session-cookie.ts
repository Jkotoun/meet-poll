import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Request, Response } from 'express';
import { Environment, NodeEnv } from '../../../config/environment.js';

export const SESSION_COOKIE = 'session';
export const SESSION_AUDIENCE = 'session';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

interface SessionClaims {
  sub: string;
}

@Injectable()
export class SessionCookie {
  private readonly options: CookieOptions;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService<Environment, true>,
  ) {
    this.options = {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.get('NODE_ENV', { infer: true }) === NodeEnv.Production,
      path: '/',
    };
  }

  async start(response: Response, userId: string): Promise<void> {
    const claims: SessionClaims = { sub: userId };
    const token = await this.jwt.signAsync(claims);
    response.cookie(SESSION_COOKIE, token, {
      ...this.options,
      maxAge: SESSION_TTL_SECONDS * 1000,
    });
  }

  clear(response: Response): void {
    response.clearCookie(SESSION_COOKIE, this.options);
  }

  async userId(request: Request): Promise<string | null> {
    const token: unknown = request.cookies?.[SESSION_COOKIE];
    if (typeof token !== 'string') {
      return null;
    }
    try {
      const { sub } = await this.jwt.verifyAsync<SessionClaims>(token);
      return typeof sub === 'string' ? sub : null;
    } catch {
      return null;
    }
  }
}
