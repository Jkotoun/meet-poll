import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { components } from '@/api/schema';
import { formatTimeRange, groupByDay } from './slots';
import { VoteControl } from './vote-control';

type EventDto = components['schemas']['EventDto'];
type TimeSlotDto = components['schemas']['TimeSlotDto'];

interface SlotListProps {
  event: EventDto;
}

export function SlotList({ event }: SlotListProps) {
  const closed = event.finalizedSlotId !== null;
  return groupByDay(event.slots, event.timezone).map((day) => (
    <section key={day.label} className="flex flex-col gap-2">
      <Typography variant="h6" component="h2">
        {day.label}
      </Typography>
      <Paper variant="outlined">
        <List disablePadding>
          {day.slots.map((slot) => {
            const time = formatTimeRange(slot, event.timezone);
            return (
              <ListItem key={slot.id} divider className="flex-wrap gap-2">
                <ListItemText
                  primary={
                    <span className="flex items-center gap-2">
                      {time}
                      <SlotBadge
                        slot={slot}
                        finalizedSlotId={event.finalizedSlotId}
                      />
                    </span>
                  }
                  secondary={`${slot.yes} yes · ${slot.ifNeedBe} if need be · ${slot.no} no`}
                />
                <VoteControl
                  slug={event.slug}
                  slotId={slot.id}
                  choice={slot.myChoice}
                  slotLabel={`${day.label}, ${time}`}
                  closed={closed}
                />
              </ListItem>
            );
          })}
        </List>
      </Paper>
    </section>
  ));
}

interface SlotBadgeProps {
  slot: TimeSlotDto;
  finalizedSlotId: string | null;
}

function SlotBadge({ slot, finalizedSlotId }: SlotBadgeProps) {
  if (finalizedSlotId !== null) {
    return slot.id === finalizedSlotId ? (
      <Chip label="Final" color="success" size="small" />
    ) : null;
  }
  // Every slot ranks first while nobody has voted.
  const hasAttendees = slot.yes + slot.ifNeedBe > 0;
  return slot.rank === 1 && hasAttendees ? (
    <Chip label="Best" color="primary" size="small" />
  ) : null;
}
