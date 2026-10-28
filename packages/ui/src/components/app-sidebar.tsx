import { Link } from '@tanstack/react-router';
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
  ConfigIcon,
  DatabaseIcon,
  EvalsIcon,
  HomeIcon,
  ResultsIcon,
} from '@/components/icons';

const navItems = [
  { href: '/suites', icon: EvalsIcon, title: 'Evals' },
  { href: '/results', icon: ResultsIcon, title: 'Results' },
  { href: '/datasets', icon: DatabaseIcon, title: 'Datasets' },
] as const;

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-16 cursor-default hover:bg-transparent active:bg-transparent"
            >
              <img
                src="/viteval-wordmark.png"
                alt="Viteval"
                width="1112"
                height="377"
                className="h-12 w-auto max-w-36 group-data-[collapsible=icon]:hidden"
              />
              <img
                src="/logo192.png"
                alt="Viteval"
                className="hidden size-8 group-data-[collapsible=icon]:block"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 pt-2">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/">
                <HomeIcon />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <NavMain items={[...navItems]} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings">
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
