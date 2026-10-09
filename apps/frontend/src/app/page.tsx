import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Typography variant="h1" className="text-4xl font-bold">
        Meet Poll
      </Typography>
      <Button variant="contained">Create a poll</Button>
    </main>
  );
}
