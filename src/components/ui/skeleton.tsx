import { cn } from '@/utils/cn';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-purple-100 dark:bg-purple-950', className)}
      {...props}
    />
  );
}

export { Skeleton };
