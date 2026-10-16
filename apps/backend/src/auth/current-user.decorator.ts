import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../users/entities/user.entity.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// For routes behind SessionGuard, which sets `request.user`.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user as User,
);
