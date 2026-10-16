import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiProblemResponse } from '../http-errors/api-problem-response.decorator.js';
import { UserDto } from '../users/dto/user.dto.js';
import type { User } from '../users/entities/user.entity.js';
import { EMAIL_ALREADY_REGISTERED } from '../users/users.service.js';
import { AuthService, INVALID_CREDENTIALS } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { CurrentUser } from './current-user.decorator.js';
import { SessionGuard, UNAUTHENTICATED } from './session.guard.js';
import { SESSION_COOKIE, SessionService } from './session.service.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly session: SessionService,
  ) {}

  @Post('register')
  @ApiCreatedResponse({ type: UserDto })
  @ApiProblemResponse(EMAIL_ALREADY_REGISTERED)
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserDto> {
    const user = await this.auth.register(body);
    await this.session.start(response, user.id);
    return UserDto.from(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserDto })
  @ApiProblemResponse(INVALID_CREDENTIALS)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserDto> {
    const user = await this.auth.login(body);
    await this.session.start(response, user.id);
    return UserDto.from(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  logout(@Res({ passthrough: true }) response: Response): void {
    this.session.clear(response);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  @Header('Cache-Control', 'no-store')
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOkResponse({ type: UserDto })
  @ApiProblemResponse(UNAUTHENTICATED)
  me(@CurrentUser() user: User): UserDto {
    return UserDto.from(user);
  }
}
