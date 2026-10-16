'use client';

import Button, { type ButtonProps } from '@mui/material/Button';
import Link from 'next/link';

type LinkButtonProps = ButtonProps & { href: string };

// MUI's `component={Link}` passes a function, which server components can't do.
export function LinkButton(props: LinkButtonProps) {
  return <Button component={Link} {...props} />;
}
