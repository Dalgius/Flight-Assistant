"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Shown instead of a blank page when rendering fails (e.g. unexpected data).
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center text-foreground">
      <h2 className="text-lg font-semibold">Something went wrong / Si è verificato un errore</h2>
      <p className="max-w-md text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Retry / Riprova</Button>
    </div>
  );
}
