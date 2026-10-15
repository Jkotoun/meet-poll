'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

interface FormFooterProps {
  submitLabel: string;
  formError: unknown;
  busy: boolean;
}

export function FormFooter({ submitLabel, formError, busy }: FormFooterProps) {
  return (
    <>
      {typeof formError === 'string' && (
        <Alert severity="error">{formError}</Alert>
      )}
      <Button type="submit" variant="contained" disabled={busy}>
        {submitLabel}
      </Button>
    </>
  );
}
