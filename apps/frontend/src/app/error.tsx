'use client';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';

interface ErrorPageProps {
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  const router = useRouter();

  // reset() alone re-renders the same server payload, which still holds the error.
  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-12">
      <Typography variant="h5" component="h1">
        Something went wrong
      </Typography>
      <Typography color="text.secondary">
        We couldn&apos;t load this page. Please try again in a moment.
      </Typography>
      <Button variant="contained" onClick={retry}>
        Try again
      </Button>
    </main>
  );
}
