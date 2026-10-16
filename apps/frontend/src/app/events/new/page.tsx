import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireUser } from '@/auth/current-user';
import { EventForm } from '@/events/event-form';

export const metadata: Metadata = { title: 'New event · Meet Poll' };

export default function NewEventPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <Typography variant="h4" component="h1">
        New event
      </Typography>
      <Suspense>
        <SignedInEventForm />
      </Suspense>
    </main>
  );
}

async function SignedInEventForm() {
  await requireUser('/events/new');
  return <EventForm />;
}
