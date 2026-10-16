'use client';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useOptimistic, useState, useTransition } from 'react';
import { browserApi } from '@/api/browser-client';
import { unwrap } from '@/api/problem';
import type { components } from '@/api/schema';

type VoteChoice = components['schemas']['VoteChoice'];

const CHOICES: { value: VoteChoice; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'if_need_be', label: 'If need be' },
  { value: 'no', label: 'No' },
];

interface VoteControlProps {
  slug: string;
  slotId: string;
  choice: VoteChoice | null;
  slotLabel: string;
  closed: boolean;
}

export function VoteControl({
  slug,
  slotId,
  choice,
  slotLabel,
  closed,
}: VoteControlProps) {
  const router = useRouter();
  const [shownChoice, showChoice] = useOptimistic(choice);
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function vote(next: VoteChoice) {
    if (pending) {
      return;
    }
    startTransition(async () => {
      showChoice(next);
      try {
        unwrap(
          await browserApi.PUT('/v1/events/{slug}/slots/{slotId}/vote', {
            params: { path: { slug, slotId } },
            body: { choice: next },
          }),
        );
        setFailed(false);
        router.refresh();
      } catch {
        setFailed(true);
        // The event may have been finalized meanwhile; show its current state.
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <ToggleButtonGroup
        exclusive
        size="small"
        color="primary"
        disabled={closed}
        value={shownChoice}
        aria-label={`Your vote for ${slotLabel}`}
        onChange={(_event, next: VoteChoice | null) => {
          if (next) {
            vote(next);
          }
        }}
      >
        {CHOICES.map(({ value, label }) => (
          <ToggleButton key={value} value={value}>
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {failed && (
        <Typography role="alert" variant="body2" color="error">
          Couldn&apos;t save your vote. Try again.
        </Typography>
      )}
    </div>
  );
}
