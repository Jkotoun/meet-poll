'use client';

import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Link from 'next/link';
import type { components } from '@/api/schema';

type EventSummary = components['schemas']['EventSummaryDto'];

interface EventListProps {
  events: EventSummary[];
}

export function EventList({ events }: EventListProps) {
  return (
    <Paper variant="outlined">
      <List disablePadding>
        {events.map((event) => (
          <ListItemButton
            key={event.slug}
            component={Link}
            href={`/events/${event.slug}`}
            divider
          >
            <ListItemText primary={event.title} />
            {event.finalized && (
              <Chip label="Finalized" color="success" size="small" />
            )}
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
