import type { Metadata } from 'next';
import { AuthCard } from '@/auth/auth-card';
import { LoginForm } from '@/auth/login-form';

export const metadata: Metadata = { title: 'Log in · Meet Poll' };

export default function LoginPage() {
  return (
    <AuthCard title="Log in">
      <LoginForm />
    </AuthCard>
  );
}
