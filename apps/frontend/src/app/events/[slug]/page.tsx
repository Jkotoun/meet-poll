import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { serverApi } from '@/api/server-client';
import { unwrap } from '@/api/problem';
import type { components } from '@/api/schema';
import { requireUser } from '@/auth/current-user';
import { CopyLinkButton } from '@/events/copy-link-button';
import { FinalizePanel, type RankedSlot } from '@/events/finalize-panel';
import { SlotList } from '@/events/slot-list';
import { formatSlot } from '@/events/slots';

export const metadata: Metadata = { title: 'Event · Meet Poll' };

type EventPageProps = PageProps<'/events/[slug]'>;
type EventDto = components['schemas']['EventDto'];

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
  const user = await requireUser(`/events/${encodeURIComponent(slug)}`);
  const api = await serverApi();
  const result = await api.GET('/v1/events/{slug}', {
    params: { path: { slug } },
  });
  if (result.response.status === 404) {
    notFound();
  }
  const event = unwrap(result);
  const finalSlot = event.slots.find(
    (slot) => slot.id === event.finalizedSlotId,
  );
  const isOrganizer = user.id === event.organizer.id;

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
      {finalSlot && (
        <Alert severity="success">
          Final time: {formatSlot(finalSlot, event.timezone)}
        </Alert>
      )}
      <CopyLinkButton />
      <SlotList event={event} />
      {isOrganizer && !finalSlot && (
        <FinalizePanel slug={event.slug} slots={rankedSlots(event)} />
      )}
    </>
  );
}

// Best first; the sort is stable, so tied slots keep the API's time order.
function rankedSlots({ slots, timezone }: EventDto): RankedSlot[] {
  return slots
    .toSorted((a, b) => a.rank - b.rank)
    .map((slot) => ({
      id: slot.id,
      label: formatSlot(slot, timezone),
      attending: slot.yes + slot.ifNeedBe,
      yes: slot.yes,
    }));
}
