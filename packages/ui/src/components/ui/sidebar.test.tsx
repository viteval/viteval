// @vitest-environment jsdom
import { useState } from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from './sidebar';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', function () {
    return { observe() {}, unobserve() {}, disconnect() {} };
  });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 400, 200)
  );
  document.cookie = 'sidebar_state=; max-age=0; path=/';
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function StateLabel() {
  const sidebar = useSidebar();
  return (
    <>
      <output>{sidebar.state}</output>
      <button type="button" onClick={() => sidebar.setOpen(false)}>
        Close panel
      </button>
      <button type="button" onClick={() => sidebar.setOpenMobile(false)}>
        Close mobile panel
      </button>
    </>
  );
}

describe('sidebar controls and navigation primitives', () => {
  it.each(['floating', 'inset'] as const)(
    'should support a collapsed right %s sidebar and slot-based menu actions',
    (variant) => {
      const { container } = render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar side="right" variant={variant} collapsible="icon">
            <SidebarGroup>
              <SidebarGroupLabel>Group label</SidebarGroupLabel>
              <SidebarGroupAction aria-label="Create group" />
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Destination">
                    Destination
                  </SidebarMenuButton>
                  <SidebarMenuAction asChild>
                    <a href="/action">Action</a>
                  </SidebarMenuAction>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </Sidebar>
        </SidebarProvider>
      );
      expect(
        container
          .querySelector('[data-slot=sidebar]')
          ?.getAttribute('data-side')
      ).toBe('right');
      expect(
        container
          .querySelector('[data-slot=sidebar]')
          ?.getAttribute('data-collapsible')
      ).toBe('icon');
      expect(
        screen.getByRole('link', { name: 'Action' }).getAttribute('href')
      ).toBe('/action');
      expect(screen.getByRole('button', { name: 'Create group' })).toBeTruthy();
    }
  );
  it('should provide safe no-op controls when a consumer is mounted without a provider', () => {
    render(
      <>
        <SidebarTrigger />
        <StateLabel />
      </>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close mobile panel' }));
    expect(screen.getByText('collapsed')).toBeTruthy();
  });
  it('should toggle desktop state by trigger, rail and keyboard and persist its cookie', () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarRail />
        </Sidebar>
        <SidebarTrigger />
        <StateLabel />
      </SidebarProvider>
    );
    expect(screen.getByText('expanded')).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Toggle Sidebar' })[1]
    );
    expect(screen.getByText('collapsed')).toBeTruthy();
    expect(document.cookie).toContain('sidebar_state=false');
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(screen.getByText('expanded')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'x', metaKey: true });
    expect(screen.getByText('expanded')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    expect(screen.getByText('collapsed')).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Toggle Sidebar' })[0]
    );
    expect(screen.getByText('expanded')).toBeTruthy();
  });
  it('should report controlled state changes to its owner', () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <SidebarProvider open={open} onOpenChange={setOpen}>
          <SidebarTrigger />
          <StateLabel />
        </SidebarProvider>
      );
    }
    render(<Controlled />);
    expect(screen.getByText('collapsed')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
    expect(screen.getByText('expanded')).toBeTruthy();
  });
  it('should preserve navigation semantics, action controls and active nested links', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { container } = render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarHeader>Project</SidebarHeader>
          <SidebarInput aria-label="Find evaluation" />
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <h2>Evals</h2>
              </SidebarGroupLabel>
              <SidebarGroupAction asChild>
                <button type="button">Add group</button>
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive tooltip="Accuracy">
                      <a href="/accuracy">Accuracy</a>
                    </SidebarMenuButton>
                    <SidebarMenuAction showOnHover>Add run</SidebarMenuAction>
                    <SidebarMenuBadge>3</SidebarMenuBadge>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          href="/accuracy/cases"
                          isActive
                          size="sm"
                        >
                          Cases
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/accuracy/history">History</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>Settings</SidebarFooter>
        </Sidebar>
        <SidebarInset>Content</SidebarInset>
      </SidebarProvider>
    );
    expect(
      screen.getByRole('link', { name: 'Accuracy' }).getAttribute('data-active')
    ).toBe('true');
    expect(
      screen.getByRole('link', { name: 'Cases' }).getAttribute('href')
    ).toBe('/accuracy/cases');
    expect(screen.getByRole('heading', { name: 'Evals' })).toBeTruthy();
    expect(
      screen.getByRole('textbox', { name: 'Find evaluation' })
    ).toBeTruthy();
    expect(
      container
        .querySelector('[data-sidebar=menu-skeleton-text]')
        ?.getAttribute('style')
    ).toContain('70%');
  });
  it('should use a modal sheet for mobile navigation and keep desktop state unchanged', async () => {
    vi.stubGlobal('innerWidth', 500);
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarMenuButton tooltip={{ children: 'Mobile item' }}>
            Mobile destination
          </SidebarMenuButton>
        </Sidebar>
        <SidebarTrigger />
        <StateLabel />
      </SidebarProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
    expect(screen.getByRole('dialog').textContent).toContain(
      'Mobile destination'
    );
    expect(screen.getByText('expanded')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
