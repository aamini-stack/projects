import { cn } from '@/lib/utils';
import * as React from 'react';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'field-sizing-content flex min-h-20 w-full px-3 py-2',
        'bg-secondary-background border-border placeholder:text-foreground/50 text-foreground rounded-base border-2 text-sm',
        'selection:bg-main selection:text-main-foreground',
        'ring-black ring-offset-2 focus-visible:outline-none focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/50 dark:aria-invalid:ring-destructive/60 dark:aria-invalid:ring-offset-background',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
