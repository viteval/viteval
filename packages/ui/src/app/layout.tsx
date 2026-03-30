import type { Metadata } from 'next';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider>
          <SidebarProvider>
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
            className: 'font-sans',
            style: {
              background: '#18181b',
              border: '1px solid #27272a',
              color: '#fafafa',
            },
          }}
        />
      </body>
    </html>
  );
}
