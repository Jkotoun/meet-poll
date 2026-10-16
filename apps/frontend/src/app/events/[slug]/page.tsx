import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { serverApi } from '@/api/server-client';
import { unwrap } from '@/api/problem';
import { requireUser } from '@/auth/current-user';
import { CopyLinkButton } from '@/events/copy-link-button';
import { SlotList } from '@/events/slot-list';

export const metadata: Metadata = { title: 'Event · Meet Poll' };

type EventPageProps = PageProps<'/events/[slug]'>;

export default function EventPage({ params }: EventPageProps) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <Suspense>
        <EventDetails params={params} />
      </Suspense>
    </main>
  );
}

async function EventDetails({ params }: { params: EventPageProps['params'] }) {
  const { slug } = await params;
  await requireUser(`/events/${encodeURIComponent(slug)}`);
  const api = await serverApi();
  const result = await api.GET('/v1/events/{slug}', {
    params: { path: { slug } },
  });
  if (result.response.status === 404) {
    notFound();
  }
  const event = unwrap(result);

  return (
    <>
      <header className="flex flex-col gap-1">
        <Typography variant="h4" component="h1">
          {event.title}
        </Typography>
        <Typography color="text.secondary">
          Organized by {event.organizer.name} · Times in {event.timezone}
        </Typography>
      </header>
      <CopyLinkButton />
      <SlotList event={event} />
    </>
  );
}
