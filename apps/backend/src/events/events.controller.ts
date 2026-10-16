import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
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
import { FinalizeDto } from './dto/finalize.dto.js';
import { VoteDto } from './dto/vote.dto.js';
import {
  EVENT_FINALIZED,
  EVENT_NOT_FOUND,
  EventsService,
  NOT_ORGANIZER,
  SLOT_NOT_FOUND,
} from './events.service.js';

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
    return EventDto.from(await this.events.create(user, body), user.id);
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
  async findOne(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
  ): Promise<EventDto> {
    return EventDto.from(await this.events.findBySlug(slug), user.id);
  }

  @Put(':slug/slots/:slotId/vote')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiProblemResponse(UNAUTHENTICATED, SLOT_NOT_FOUND, EVENT_FINALIZED)
  async vote(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('slotId', ParseUUIDPipe) slotId: string,
    @Body() { choice }: VoteDto,
  ): Promise<void> {
    await this.events.vote(user, slug, slotId, choice);
  }

  @Post(':slug/finalize')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Finalized, or already on this slot' })
  @ApiProblemResponse(
    UNAUTHENTICATED,
    NOT_ORGANIZER,
    SLOT_NOT_FOUND,
    EVENT_FINALIZED,
  )
  async finalize(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() { slotId }: FinalizeDto,
  ): Promise<void> {
    await this.events.finalize(user, slug, slotId);
  }
}
