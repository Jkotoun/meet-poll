import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  children: ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Paper className="flex w-full max-w-sm flex-col gap-4 p-6">
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        {children}
      </Paper>
    </main>
  );
}
