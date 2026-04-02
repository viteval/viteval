'use client';

import { Icon, type IconProps } from '@iconify/react';
import { cn } from '@/lib/utils';

type Props = Omit<IconProps, 'icon'> & { className?: string };

function createIcon(icon: string, defaultClass?: string) {
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

/*
|------------------
| Catppuccin — file types (multi-color, used where color matters)
|------------------
*/

export const TypeScriptIcon = createIcon('catppuccin:typescript');
export const JavaScriptIcon = createIcon('catppuccin:javascript');
export const FileIcon = createIcon('catppuccin:file');
export const TextIcon = createIcon('catppuccin:text');
export const ImageIcon = createIcon('catppuccin:image');
export const KeyIcon = createIcon('catppuccin:key');
export const LogIcon = createIcon('catppuccin:log');
export const TodoIcon = createIcon('catppuccin:todo');
export const ViteIcon = createIcon('catppuccin:vite');
export const WorkflowIcon = createIcon('catppuccin:workflow');

/*
|------------------
| Heroicons — semantic (monochrome, inherits currentColor)
|------------------
*/

export const EvalsIcon = createIcon('heroicons:beaker');
export const ResultsIcon = createIcon('heroicons:chart-bar');
export const DatabaseIcon = createIcon('heroicons:circle-stack');
export const DashboardIcon = createIcon('heroicons:squares-2x2');
export const ConfigIcon = createIcon('heroicons:cog-6-tooth');
export const BookIcon = createIcon('heroicons:book-open');
export const GithubIcon = createIcon('catppuccin:github');
export const SecurityIcon = createIcon('heroicons:shield-check');

/*
|------------------
| Lucide (via iconify) — UI chrome
|------------------
*/

export const SearchIcon = createIcon('lucide:search');
export const CopyIcon = createIcon('lucide:copy');
export const DownloadIcon = createIcon('lucide:download');
export const UploadIcon = createIcon('lucide:upload');
export const RefreshIcon = createIcon('lucide:rotate-ccw');
export const PencilIcon = createIcon('lucide:pencil');
export const PlayIcon = createIcon('lucide:play');
export const HashIcon = createIcon('lucide:hash');
export const ChevronDownIcon = createIcon('lucide:chevron-down');
export const ChevronRightIcon = createIcon('lucide:chevron-right');
export const CheckIcon = createIcon('lucide:check');
export const XIcon = createIcon('lucide:x');
export const ClockIcon = createIcon('lucide:clock');
export const ArrowRightIcon = createIcon('lucide:arrow-right');
export const TargetIcon = createIcon('lucide:target');
export const TrendingUpIcon = createIcon('lucide:trending-up');
export const CircleCheckIcon = createIcon('lucide:circle-check');
export const CircleXIcon = createIcon('lucide:circle-x');
export const HomeIcon = createIcon('lucide:home');
