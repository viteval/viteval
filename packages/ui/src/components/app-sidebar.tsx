'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { NavMain } from '@/components/nav-main';
import {
  BarChartIcon,
  ConfigIcon,
  DatabaseIcon,
  FlaskIcon,
  HomeIcon,
} from '@/components/icons';

const navItems = [
  { href: '/suites', icon: FlaskIcon, title: 'Evals' },
  { href: '/results', icon: BarChartIcon, title: 'Results' },
  { href: '/datasets', icon: DatabaseIcon, title: 'Datasets' },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default hover:bg-transparent active:bg-transparent"
            >
              <img src="/logo192.png" alt="Viteval" className="size-8" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">Viteval</span>
                <Badge variant="secondary">alpha</Badge>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 pt-2">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <HomeIcon />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <ConfigIcon />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
