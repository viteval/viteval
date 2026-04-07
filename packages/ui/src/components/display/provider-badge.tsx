'use client';

import { Icon } from '@iconify/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProviderConfig {
  label: string;
  icon: string;
  color?: string;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  braintrust: {
    color: 'text-orange-400',
    icon: 'simple-icons:braintrust',
    label: 'Braintrust',
  },
  local: {
    color: 'text-muted-foreground',
    icon: 'lucide:hard-drive',
    label: 'Local',
  },
  memory: {
    color: 'text-muted-foreground',
    icon: 'lucide:cpu',
    label: 'Memory',
  },
  postgres: {
    color: 'text-blue-400',
    icon: 'devicon-plain:postgresql',
    label: 'Postgres',
  },
  sqlite: {
    color: 'text-sky-400',
    icon: 'devicon-plain:sqlite',
    label: 'SQLite',
  },
  viteval: {
    color: 'text-purple-400',
    icon: 'lucide:database',
    label: 'Viteval',
  },
};

const DEFAULT_PROVIDER: ProviderConfig = {
  color: 'text-muted-foreground',
  icon: 'lucide:database',
  label: 'Unknown',
};

interface ProviderBadgeProps {
  provider: string;
  className?: string;
}

/**
 * Render a badge with the provider's icon and label.
 *
 * @example
 * ```tsx
 * <ProviderBadge provider="viteval" />
 * <ProviderBadge provider="braintrust" />
 * <ProviderBadge provider="local" />
 * ```
 */
export function ProviderBadge({ provider, className }: ProviderBadgeProps) {
  const config =
    PROVIDERS[provider.toLowerCase()] ?? {
      ...DEFAULT_PROVIDER,
      label: provider,
    };

  return (
    <Badge
      variant="outline"
      className={cn('inline-flex items-center gap-1 text-xs', className)}
    >
      <Icon
        icon={config.icon}
        className={cn('h-3 w-3 shrink-0', config.color)}
      />
      {config.label}
    </Badge>
  );
}
