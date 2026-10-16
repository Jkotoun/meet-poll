import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrentUser } from '@/auth/current-user';

export const metadata: Metadata = { title: 'Account · Meet Poll' };

export default function AccountPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-12">
      <Typography variant="h4" component="h1">
        Account
      </Typography>
      <Suspense>
        <AccountDetails />
      </Suspense>
    </main>
  );
}

async function AccountDetails() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?next=/account');
  }
  return (
    <Paper className="flex flex-col gap-1 p-6">
      <Typography variant="h6">{user.name}</Typography>
      <Typography color="text.secondary">{user.email}</Typography>
    </Paper>
  );
}
