import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { GeistMono } from 'geist/font/mono';
import { GeistPixelSquare } from 'geist/font/pixel';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

export const metadata: Metadata = {
  description: 'Local UI for viewing the results of your evals',
  title: 'Viteval | Evaluation Results',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get('sidebar_state')?.value;
  const defaultOpen = sidebarState !== 'false';

  return (
    <html
      lang="en"
      className={`${GeistMono.variable} ${GeistPixelSquare.variable}`}
    >
      <body>
        <TooltipProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <SidebarInset>
              <SiteHeader />
              <main className="flex-1">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
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
      </body>
    </html>
  );
}
