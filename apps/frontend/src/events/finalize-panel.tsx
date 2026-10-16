'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { browserApi } from '@/api/browser-client';
import { unwrap } from '@/api/problem';

export interface RankedSlot {
  id: string;
  label: string;
  attending: number;
  yes: number;
}

interface FinalizePanelProps {
  slug: string;
  slots: RankedSlot[];
}

export function FinalizePanel({ slug, slots }: FinalizePanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function pick({ id, label }: RankedSlot) {
    if (!window.confirm(`Pick ${label}? Voting closes for good.`)) {
      return;
    }
    startTransition(async () => {
      try {
        unwrap(
          await browserApi.POST('/v1/events/{slug}/finalize', {
            params: { path: { slug } },
            body: { slotId: id },
          }),
        );
        setFailed(false);
        router.refresh();
      } catch {
        setFailed(true);
        router.refresh();
      }
    });
  }

  return (
    <section className="flex flex-col gap-2">
      <Typography variant="h6" component="h2">
        Pick the final time
      </Typography>
      <Typography color="text.secondary">
        Best first: most people who can attend, then most yes votes.
      </Typography>
      {failed && (
        <Alert severity="error">Couldn&apos;t pick that time. Try again.</Alert>
      )}
      <Paper variant="outlined">
        <List disablePadding aria-label="Ranked slots">
          {slots.map((slot) => (
            <ListItem
              key={slot.id}
              divider
              secondaryAction={
                <Button disabled={pending} onClick={() => pick(slot)}>
                  Pick
                </Button>
              }
            >
              <ListItemText
                primary={slot.label}
                secondary={`${slot.attending} can attend · ${slot.yes} yes`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </section>
  );
}
