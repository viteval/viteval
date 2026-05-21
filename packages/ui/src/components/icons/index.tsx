'use client';

import { Icon, type IconProps } from '@iconify/react';
import { cn } from '@/lib/utils';

type Props = Omit<IconProps, 'icon'> & { className?: string };

interface CreateIconParams {
  icon: string;
  defaultClass?: string;
}

function createIcon({ icon, defaultClass }: CreateIconParams) {
  return function IconComponent({ className, ...props }: Props) {
    return (
      <Icon
        icon={icon}
        className={cn(defaultClass ?? 'h-4 w-4', className)}
        {...props}
      />
    );
  };
}

export const TypeScriptIcon = createIcon({ icon: 'catppuccin:typescript' });
export const JavaScriptIcon = createIcon({ icon: 'catppuccin:javascript' });
export const FileIcon = createIcon({ icon: 'catppuccin:file' });
export const TextIcon = createIcon({ icon: 'catppuccin:text' });
export const ImageIcon = createIcon({ icon: 'catppuccin:image' });
export const KeyIcon = createIcon({ icon: 'catppuccin:key' });
export const LogIcon = createIcon({ icon: 'catppuccin:log' });
export const TodoIcon = createIcon({ icon: 'catppuccin:todo' });
export const ViteIcon = createIcon({ icon: 'catppuccin:vite' });
export const WorkflowIcon = createIcon({ icon: 'catppuccin:workflow' });

export const EvalsIcon = createIcon({ icon: 'lucide:flask-conical' });
export const ResultsIcon = createIcon({ icon: 'lucide:bar-chart-3' });
export const DatabaseIcon = createIcon({ icon: 'lucide:database' });
export const DashboardIcon = createIcon({ icon: 'lucide:layout-dashboard' });
export const ConfigIcon = createIcon({ icon: 'lucide:settings' });
export const BookIcon = createIcon({ icon: 'lucide:book-open' });
export const GithubIcon = createIcon({ icon: 'lucide:github' });
export const SecurityIcon = createIcon({ icon: 'lucide:shield-check' });

export const SearchIcon = createIcon({ icon: 'lucide:search' });
export const CopyIcon = createIcon({ icon: 'lucide:copy' });
export const DownloadIcon = createIcon({ icon: 'lucide:download' });
export const UploadIcon = createIcon({ icon: 'lucide:upload' });
export const RefreshIcon = createIcon({ icon: 'lucide:rotate-ccw' });
export const PencilIcon = createIcon({ icon: 'lucide:pencil' });
export const PlayIcon = createIcon({ icon: 'lucide:play' });
export const HashIcon = createIcon({ icon: 'lucide:hash' });
export const ChevronDownIcon = createIcon({ icon: 'lucide:chevron-down' });
export const ChevronRightIcon = createIcon({ icon: 'lucide:chevron-right' });
export const CheckIcon = createIcon({ icon: 'lucide:check' });
export const XIcon = createIcon({ icon: 'lucide:x' });
export const ClockIcon = createIcon({ icon: 'lucide:clock' });
export const ArrowRightIcon = createIcon({ icon: 'lucide:arrow-right' });
export const TargetIcon = createIcon({ icon: 'lucide:target' });
export const TrendingUpIcon = createIcon({ icon: 'lucide:trending-up' });
export const CircleCheckIcon = createIcon({ icon: 'lucide:circle-check' });
export const CircleXIcon = createIcon({ icon: 'lucide:circle-x' });
export const HomeIcon = createIcon({ icon: 'lucide:home' });
export const PlusIcon = createIcon({ icon: 'lucide:plus' });
export const TagIcon = createIcon({ icon: 'lucide:tag' });
