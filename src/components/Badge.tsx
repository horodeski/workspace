import React from 'react';
import { cn } from '../lib/utils';

export interface BadgeProps {
  variant: 'default' | 'success' | 'warning' | 'destructive';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeProps['variant'], string> = {
  default:
    'bg-secondary text-secondary-foreground',
  success:
    'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning:
    'bg-amber-500/15 text-amber-400 border-amber-500/20',
  destructive:
    'bg-destructive/15 text-red-400 border-destructive/20',
};

export const Badge: React.FC<BadgeProps> = ({ variant, children, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        'transition-colors',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
