import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import {
  ProblemException,
  ProblemType,
} from '../http-errors/problem.exception.js';
import { UsersService } from '../users/users.service.js';
import type { AuthenticatedRequest } from './current-user.decorator.js';
import { SessionService } from './session.service.js';

export const UNAUTHENTICATED: ProblemType = {
  status: HttpStatus.UNAUTHORIZED,
  code: 'unauthenticated',
  title: 'Authentication required',
};

// Loads the user on every request, so deleted accounts lose access immediately.
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly session: SessionService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = await this.session.readUserId(request);
    const user = userId ? await this.users.findById(userId) : null;
    if (!user) {
      throw new ProblemException(UNAUTHENTICATED, 'Sign in to continue');
    }
    request.user = user;
    return true;
  }
}
