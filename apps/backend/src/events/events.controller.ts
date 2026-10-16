import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionGuard, UNAUTHENTICATED } from '../auth/session.guard.js';
import { SESSION_COOKIE } from '../auth/session.service.js';
import { ApiProblemResponse } from '../http-errors/api-problem-response.decorator.js';
import type { User } from '../users/entities/user.entity.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { EventDto, EventSummaryDto } from './dto/event.dto.js';
import { EVENT_NOT_FOUND, EventsService } from './events.service.js';

@ApiTags('events')
@ApiCookieAuth(SESSION_COOKIE)
@Controller('events')
@UseGuards(SessionGuard)
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Post()
  @ApiCreatedResponse({ type: EventDto })
  @ApiProblemResponse(UNAUTHENTICATED)
  async create(
    @CurrentUser() user: User,
    @Body() body: CreateEventDto,
  ): Promise<EventDto> {
    return EventDto.from(await this.events.create(user, body));
  }

  @Get()
  @ApiOkResponse({ type: [EventSummaryDto] })
  @ApiProblemResponse(UNAUTHENTICATED)
  async findMine(@CurrentUser() user: User): Promise<EventSummaryDto[]> {
    const events = await this.events.findOrganizedBy(user);
    return events.map((event) => EventSummaryDto.from(event));
  }

  @Get(':slug')
  @ApiOkResponse({ type: EventDto })
  @ApiProblemResponse(UNAUTHENTICATED, EVENT_NOT_FOUND)
  async findOne(@Param('slug') slug: string): Promise<EventDto> {
    return EventDto.from(await this.events.findBySlug(slug));
  }
}
