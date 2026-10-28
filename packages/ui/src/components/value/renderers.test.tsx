// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { ValueRenderer } from './value-renderer';
import { ValuePreview } from './value-preview';
import { MarkdownRenderer } from './markdown-renderer';
import { CodeRenderer } from './code-renderer';
import { CopyButton } from './copy-button';
import { detectValueKind, getKindLabel, getKindVariant } from './detect';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('value presentation', () => {
  it.each([null, undefined, true, false, 42])(
    'should render primitive %s without losing its type',
    (value) => {
      const { container } = render(<ValueRenderer value={value} />);
      expect(container.textContent).toContain(String(value ?? null));
    }
  );
  it.each([
    { value: undefined, expected: '' },
    { value: null, expected: 'null' },
    { value: true, expected: 'true' },
    { value: 'short', expected: 'short' },
    { value: 'long value', expected: 'long …' },
    { value: { x: 1 }, expected: '{"x":…' },
    { value: [], expected: '[]' },
  ])('should show a bounded preview for $value', ({ value, expected }) => {
    const { container } = render(<ValuePreview value={value} maxLength={5} />);
    expect(container.querySelector('span.text-xs')?.textContent).toBe(expected);
  });
  it.each([
    '# heading',
    '- item',
    '1. item',
    '**bold**',
    '[link](https://example.com)',
    '> quoted',
    '|cell|',
  ])('should classify markdown syntax %s', (value) => {
    expect(detectValueKind(value)).toBe('markdown');
  });
  it('should classify non-JSON primitives and unknown values as plain text', () => {
    expect(detectValueKind(Symbol('value'))).toBe('text');
    expect(detectValueKind('null')).toBe('text');
    expect(detectValueKind('42')).toBe('text');
    for (const [kind, label, variant] of [
      ['object', '{ }', 'default'],
      ['text', 'Aa', 'outline'],
      ['markdown', '¶', 'outline'],
      ['code', '</>', 'secondary'],
      ['primitive', '#', 'outline'],
    ] as const) {
      expect(getKindLabel(kind)).toBe(label);
      expect(getKindVariant(kind)).toBe(variant);
    }
  });
  it('should switch markdown between semantic rendered output and original source', () => {
    const source =
      '# Heading\n\nUse `inline` code.\n\n```ts\nconst answer = 42;\n```';
    const { container } = render(
      <MarkdownRenderer value={source} label="Answer" />
    );
    expect(screen.getByRole('heading', { name: 'Heading' })).toBeTruthy();
    expect(container.querySelector('code')?.textContent).toBe('inline');
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Source' }), {
      button: 0,
      ctrlKey: false,
    });
    expect(screen.getByRole('tabpanel').textContent).toContain(source);
  });
  it.each([
    '```ts\nconst answer = 42;\n```',
    '```\nplain code\n```',
    'unfenced code',
  ])('should render code and extract fenced bodies for copying', (source) => {
    const { container } = render(<CodeRenderer value={source} />);
    expect(container.querySelector('code')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy value' })).toBeTruthy();
  });
  it('should dispatch text, code and markdown through the value renderer', () => {
    const { rerender } = render(<ValueRenderer value="ordinary text" />);
    expect(screen.getByText('ordinary text')).toBeTruthy();
    rerender(<ValueRenderer value="# Title" />);
    expect(screen.getByRole('heading', { name: 'Title' })).toBeTruthy();
    rerender(<ValueRenderer value={'```\ncode body\n```'} />);
    expect(screen.getByText('code body')).toBeTruthy();
  });
});

describe('clipboard interaction', () => {
  it('should copy the exact content and reset the confirmation after two seconds', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const success = vi.spyOn(toast, 'success').mockReturnValue('toast');
    render(<CopyButton content={'exact\ncontent'} label="Output" />);
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Copy output' }))
    );
    expect(writeText).toHaveBeenCalledWith('exact\ncontent');
    expect(screen.getByRole('button', { name: 'Output copied' })).toBeTruthy();
    expect(success).toHaveBeenCalledWith('Output copied to clipboard');
    await act(async () => vi.advanceTimersByTime(2000));
    expect(screen.getByRole('button', { name: 'Copy output' })).toBeTruthy();
  });
  it('should report denied clipboard access without displaying a success confirmation', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    const error = vi.spyOn(toast, 'error').mockReturnValue('toast');
    render(<CopyButton content="value" />);
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Copy value' }))
    );
    expect(error).toHaveBeenCalledWith('Failed to copy to clipboard');
    expect(screen.getByRole('button', { name: 'Copy value' })).toBeTruthy();
  });
});
