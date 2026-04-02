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
| Catppuccin — branded / semantic
|------------------
*/

export const TypeScriptIcon = createIcon('catppuccin:typescript');
export const JavaScriptIcon = createIcon('catppuccin:javascript');
export const FileIcon = createIcon('catppuccin:file');
export const DatabaseIcon = createIcon('catppuccin:database');
export const DashboardIcon = createIcon('catppuccin:dashboard');
export const ConfigIcon = createIcon('catppuccin:config');
export const GithubIcon = createIcon('catppuccin:github');
export const BookIcon = createIcon('catppuccin:book');
export const SearchIcon = createIcon('catppuccin:search');
export const CopyIcon = createIcon('catppuccin:copy');
export const DownloadIcon = createIcon('catppuccin:download');
export const UploadIcon = createIcon('catppuccin:upload');
export const RefreshIcon = createIcon('catppuccin:refresh');
export const PencilIcon = createIcon('catppuccin:pencil');
export const PlayIcon = createIcon('catppuccin:play');
export const HashIcon = createIcon('catppuccin:hash');
export const BenchmarkIcon = createIcon('catppuccin:benchmark');

export const EvalsIcon = createIcon('catppuccin:vitest');
export const ResultsIcon = createIcon('catppuccin:benchmark');
export const ViteIcon = createIcon('catppuccin:vite');
export const TextIcon = createIcon('catppuccin:text');
export const TodoIcon = createIcon('catppuccin:todo');
export const SecurityIcon = createIcon('catppuccin:security');
export const WorkflowIcon = createIcon('catppuccin:workflow');
export const LogIcon = createIcon('catppuccin:log');
export const KeyIcon = createIcon('catppuccin:key');
export const ImageIcon = createIcon('catppuccin:image');

/*
|------------------
| Lucide (via iconify) — UI chrome
|------------------
*/

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
export const LayoutDashboardIcon = createIcon('lucide:layout-dashboard');
