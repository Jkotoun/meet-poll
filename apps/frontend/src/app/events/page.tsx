import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { serverApi } from '@/api/server-client';
import { unwrap } from '@/api/problem';
import { requireUser } from '@/auth/current-user';
import { EventList } from '@/events/event-list';
import { LinkButton } from '@/shell/link-button';

export const metadata: Metadata = { title: 'My events · Meet Poll' };

export default function EventsPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <Typography variant="h4" component="h1">
          My events
        </Typography>
        <LinkButton href="/events/new" variant="contained">
          New event
        </LinkButton>
      </div>
      <Suspense>
        <MyEvents />
      </Suspense>
    </main>
  );
}

async function MyEvents() {
  await requireUser('/events');
  const api = await serverApi();
  const events = unwrap(await api.GET('/v1/events'));
  if (events.length === 0) {
    return (
      <Typography color="text.secondary">
        You haven&apos;t created any events yet.
      </Typography>
    );
  }
  return <EventList events={events} />;
}
