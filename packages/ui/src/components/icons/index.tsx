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
export const BarChartIcon = createIcon('lucide:bar-chart-3');
export const FlaskIcon = createIcon('lucide:flask-conical');
export const LayoutDashboardIcon = createIcon('lucide:layout-dashboard');
