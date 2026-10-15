import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ApiProblemResponse } from '../../../http-errors/api-problem-response.decorator.js';
import { EMAIL_ALREADY_REGISTERED } from '../../../users/users.api.js';
import { RegisterUser } from '../../application/register-user.js';
import { RegisterRequestDto } from './register-request.dto.js';
import { UserResponseDto } from './user-response.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly registerUser: RegisterUser) {}

  @Post('register')
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiProblemResponse(EMAIL_ALREADY_REGISTERED)
  async register(@Body() body: RegisterRequestDto): Promise<UserResponseDto> {
    const user = await this.registerUser.execute(body);
    return UserResponseDto.from(user);
  }
}
