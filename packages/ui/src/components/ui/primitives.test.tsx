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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './collapsible';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb';
import { Badge } from './badge';

const scrollIntoView = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollIntoView'
);
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', function () {
    return { observe() {}, unobserve() {}, disconnect() {} };
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (scrollIntoView)
    Object.defineProperty(
      HTMLElement.prototype,
      'scrollIntoView',
      scrollIntoView
    );
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});

describe('UI primitive composition', () => {
  it('should disclose content with an accessible trigger and hide it again', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Details</CollapsibleTrigger>
        <CollapsibleContent>Disclosed content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.queryByText('Disclosed content')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByText('Disclosed content')).toBeTruthy();
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe(
      'true'
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('Disclosed content')).toBeNull();
  });

  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'should open an accessible %s sheet and close from its footer',
    async (side) => {
      render(
        <Sheet>
          <SheetTrigger>Open sheet</SheetTrigger>
          <SheetContent side={side} showCloseButton={false}>
            <SheetHeader>
              <SheetTitle>Run details</SheetTitle>
              <SheetDescription>Review this evaluation</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose>Finish review</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );
      fireEvent.click(screen.getByRole('button', { name: 'Open sheet' }));
      const dialog = screen.getByRole('dialog', { name: 'Run details' });
      expect(dialog.className).toContain(
        side === 'top' || side === 'bottom' ? 'inset-x-0' : 'inset-y-0'
      );
      expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Finish review' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    }
  );

  it('should preserve popover anchor and descriptive content when opened', () => {
    render(
      <Popover>
        <PopoverAnchor>
          <span>Anchor</span>
        </PopoverAnchor>
        <PopoverTrigger>Explain</PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Score</PopoverTitle>
            <PopoverDescription>Higher is better</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Explain' }));
    expect(screen.getByRole('dialog').textContent).toContain(
      'Higher is better'
    );
    expect(
      screen.getByText('Anchor').parentElement?.getAttribute('data-slot')
    ).toBe('popover-anchor');
  });

  it('should select grouped choices while preserving labels and separators', async () => {
    function Choices() {
      const [value, setValue] = useState('one');
      return (
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger aria-label="Dataset">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Available datasets</SelectLabel>
              <SelectItem value="one">First dataset</SelectItem>
              <SelectSeparator />
              <SelectItem value="two">Second dataset</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    }
    render(<Choices />);
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByText('Available datasets')).toBeTruthy();
    fireEvent.click(
      await screen.findByRole('option', { name: 'Second dataset' })
    );
    expect(screen.getByRole('combobox').textContent).toContain(
      'Second dataset'
    );
  });

  it('should propagate checkbox, radio and submenu actions through the dropdown wrappers', async () => {
    const selected = vi.fn();
    function Menu() {
      const [checked, setChecked] = useState(false);
      const [value, setValue] = useState('first');
      return (
        <DropdownMenu>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent>
              <DropdownMenuLabel inset>Run options</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuCheckboxItem
                  checked={checked}
                  onCheckedChange={setChecked}
                  onSelect={(event) => event.preventDefault()}
                >
                  Pinned
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
                  <DropdownMenuRadioItem
                    value="first"
                    onSelect={(event) => event.preventDefault()}
                  >
                    First
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="second"
                    onSelect={(event) => event.preventDefault()}
                  >
                    Second
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger inset>Export</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem variant="destructive" onSelect={selected}>
                      JSON<DropdownMenuShortcut>J</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      );
    }
    render(<Menu />);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Actions' }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(
      await screen.findByRole('menuitemcheckbox', { name: 'Pinned' })
    );
    expect(
      screen.getByRole('menuitemcheckbox').getAttribute('aria-checked')
    ).toBe('true');
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Second' }));
    expect(
      screen
        .getByRole('menuitemradio', { name: 'Second' })
        .getAttribute('aria-checked')
    ).toBe('true');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Export' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /JSON/ }));
    expect(selected).toHaveBeenCalledOnce();
  });

  it('should preserve semantic card, breadcrumb, badge and table composition', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Evaluation</CardTitle>
          <CardDescription>Latest run</CardDescription>
          <CardAction>
            <Badge asChild>
              <a href="/run">Open run</a>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Current</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Table>
            <TableCaption>Run scores</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Scorer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Accuracy</TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Total: 1</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
        <CardFooter>Finished</CardFooter>
      </Card>
    );
    expect(screen.getByRole('table').textContent).toContain('Run scores');
    expect(
      screen.getByRole('link', { name: 'Open run' }).getAttribute('data-slot')
    ).toBe('badge');
    expect(screen.getByText('Current').getAttribute('aria-current')).toBe(
      'page'
    );
    expect(screen.getByText('More')).toBeTruthy();
    expect(screen.getByText('Total: 1').closest('tfoot')).toBeTruthy();
  });
});
