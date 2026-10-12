import { cn } from '../../utils/cn';

export function Skeleton({ className, ...props }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-bg-tertiary', className)} {...props} />;
}
