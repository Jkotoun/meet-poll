import type { Metadata } from 'next';
import { AuthCard } from '@/auth/auth-card';
import { LogInForm } from '@/auth/log-in-form';

export const metadata: Metadata = { title: 'Log in · Meet Poll' };

export default function LogInPage() {
  return (
    <AuthCard title="Log in">
      <LogInForm />
    </AuthCard>
  );
}
