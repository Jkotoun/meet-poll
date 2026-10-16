import type { Metadata } from 'next';
import { AuthCard } from '@/auth/auth-card';
import { RegisterForm } from '@/auth/register-form';

export const metadata: Metadata = { title: 'Create account · Meet Poll' };

export default function RegisterPage() {
  return (
    <AuthCard title="Create account">
      <RegisterForm />
    </AuthCard>
  );
}
