import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import type { Response } from 'express';

// Named throttlers only emit non-standard `Retry-After-<name>` headers.
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    context
      .switchToHttp()
      .getResponse<Response>()
      .header('Retry-After', String(detail.timeToBlockExpire));
    await super.throwThrottlingException(context, detail);
  }
}
