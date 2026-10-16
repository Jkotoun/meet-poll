import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { components } from '@/api/schema';
import { formatTimeRange, groupByDay } from './slots';

type EventDto = components['schemas']['EventDto'];

interface SlotListProps {
  event: EventDto;
}

export function SlotList({ event }: SlotListProps) {
  return groupByDay(event.slots, event.timezone).map((day) => (
    <section key={day.label} className="flex flex-col gap-2">
      <Typography variant="h6" component="h2">
        {day.label}
      </Typography>
      <Paper variant="outlined">
        <List disablePadding>
          {day.slots.map((slot) => (
            <ListItem key={slot.id} divider>
              <ListItemText primary={formatTimeRange(slot, event.timezone)} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </section>
  ));
}
