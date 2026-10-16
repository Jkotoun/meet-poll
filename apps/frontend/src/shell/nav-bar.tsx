'use client';

import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCurrentUser, useLogout } from '@/auth/session';
import { LinkButton } from './link-button';

interface NavBarFrameProps {
  children?: ReactNode;
}

export function NavBarFrame({ children }: NavBarFrameProps) {
  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar component="nav" aria-label="Main" className="gap-2">
        <Typography
          component={Link}
          href="/"
          variant="h6"
          className="mr-auto no-underline"
          color="inherit"
        >
          Meet Poll
        </Typography>
        {children}
      </Toolbar>
    </AppBar>
  );
}

export function NavBar() {
  const { data: user, isPending, isError } = useCurrentUser();
  if (isPending || isError) {
    return <NavBarFrame />;
  }
  return (
    <NavBarFrame>
      {user ? <SignedInActions name={user.name} /> : <SignedOutActions />}
    </NavBarFrame>
  );
}

interface SignedInActionsProps {
  name: string;
}

function SignedInActions({ name }: SignedInActionsProps) {
  const router = useRouter();
  const logout = useLogout();

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.push('/');
        // Drops server-rendered pages cached for the signed-in user.
        router.refresh();
      },
    });
  }

  return (
    <>
      {logout.isError && (
        <Typography role="status" variant="body2" color="error">
          Couldn&apos;t log out. Try again.
        </Typography>
      )}
      <LinkButton href="/account" color="inherit">
        {name}
      </LinkButton>
      <Button
        color="inherit"
        disabled={logout.isPending}
        onClick={handleLogout}
      >
        Log out
      </Button>
    </>
  );
}

function SignedOutActions() {
  return (
    <>
      <LinkButton href="/login" color="inherit">
        Log in
      </LinkButton>
      <LinkButton href="/register" variant="contained">
        Create account
      </LinkButton>
    </>
  );
}
