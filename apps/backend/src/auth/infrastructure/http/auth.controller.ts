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
import { ApiProblemResponse } from '../../../http-errors/api-problem-response.decorator.js';
import { EMAIL_ALREADY_REGISTERED } from '../../../users/users.api.js';
import type { UserDto } from '../../../users/users.api.js';
import { LogInUser } from '../../application/log-in-user.js';
import { RegisterUser } from '../../application/register-user.js';
import { INVALID_CREDENTIALS } from '../../domain/invalid-credentials.error.js';
import { UNAUTHENTICATED } from '../../domain/unauthenticated.error.js';
import { SESSION_COOKIE, SessionCookie } from '../session/session-cookie.js';
import { LogInRequestDto } from './log-in-request.dto.js';
import { RegisterRequestDto } from './register-request.dto.js';
import { CurrentUser, SessionGuard } from './session.guard.js';
import { UserResponseDto } from './user-response.dto.js';

const NO_STORE = ['Cache-Control', 'no-store'] as const;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly logInUser: LogInUser,
    private readonly session: SessionCookie,
  ) {}

  @Post('register')
  @Header(...NO_STORE)
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiProblemResponse(EMAIL_ALREADY_REGISTERED)
  async register(
    @Body() body: RegisterRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponseDto> {
    const user = await this.registerUser.execute(body);
    await this.session.start(response, user.id);
    return UserResponseDto.from(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header(...NO_STORE)
  @ApiOkResponse({ type: UserResponseDto })
  @ApiProblemResponse(INVALID_CREDENTIALS)
  async logIn(
    @Body() body: LogInRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponseDto> {
    const user = await this.logInUser.execute(body);
    await this.session.start(response, user.id);
    return UserResponseDto.from(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header(...NO_STORE)
  @ApiNoContentResponse()
  logOut(@Res({ passthrough: true }) response: Response): void {
    this.session.clear(response);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  @Header(...NO_STORE)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOkResponse({ type: UserResponseDto })
  @ApiProblemResponse(UNAUTHENTICATED)
  me(@CurrentUser() user: UserDto): UserResponseDto {
    return UserResponseDto.from(user);
  }
}
