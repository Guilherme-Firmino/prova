import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
        secondary: 'border-transparent bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
        accent: 'border-transparent bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300',
        outline: 'text-gray-500 dark:text-gray-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
