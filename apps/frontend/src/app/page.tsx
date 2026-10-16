import Typography from '@mui/material/Typography';
import { LinkButton } from '@/shell/link-button';

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-24 text-center">
      <Typography variant="h3" component="h1" className="font-bold">
        Find a time that works for everyone
      </Typography>
      <Typography variant="h6" component="p" color="text.secondary">
        Propose a few slots, share one link, and let everyone vote yes, no or
        if-need-be. Meet Poll picks the slot where the most people can make it.
      </Typography>
      <LinkButton href="/register" variant="contained" size="large">
        Get started
      </LinkButton>
    </main>
  );
}
