'use client';

import Button from '@mui/material/Button';
import { useState } from 'react';

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard
      .writeText(window.location.href)
      .then(() => setCopied(true));
  }

  return (
    <Button variant="outlined" className="self-start" onClick={copy}>
      {copied ? 'Link copied' : 'Copy link'}
    </Button>
  );
}
