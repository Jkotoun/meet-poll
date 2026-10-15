import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService, type UserDto } from '../../../users/users.api.js';
import { UnauthenticatedError } from '../../domain/unauthenticated.error.js';
import { SessionCookie } from '../session/session-cookie.js';

interface AuthenticatedRequest extends Request {
  user?: UserDto;
}

// Loads the user on every request, so deleted accounts lose access immediately.
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly session: SessionCookie,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = await this.session.userId(request);
    const user = userId && (await this.users.findById(userId));
    if (!user) {
      throw new UnauthenticatedError();
    }
    request.user = user;
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserDto => {
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) {
      throw new Error('CurrentUser requires SessionGuard on the route');
    }
    return user;
  },
);
