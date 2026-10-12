import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import appCss from '@/app/globals.css?url';
import NotFound from '@/app/not-found';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

const getSidebarState = createServerFn({ method: 'GET' }).handler(
  () => getCookie('sidebar_state') !== 'false'
);

export const Route = createRootRoute({
  beforeLoad: async () => ({ sidebarOpen: await getSidebarState() }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Viteval | Evaluation Results' },
      {
        name: 'description',
        content: 'Local UI for viewing the results of your evals',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  component: Dashboard,
  shellComponent: Document,
  notFoundComponent: NotFound,
});

function Dashboard() {
  const { sidebarOpen } = Route.useRouteContext();
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'font-mono',
            style: {
              background: '#0a0a0c',
              border: '1px solid #1a1a2e',
              color: '#c0c0d0',
            },
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
