import { Link, useLocation } from '@tanstack/react-router';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface NavItem {
  title: string;
  href: '/' | '/datasets' | '/results' | '/suites' | '/settings';
  icon: React.ComponentType<{ className?: string }>;
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                }
              >
                <Link to={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
