// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Route } from './settings';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('PointerEvent', MouseEvent);
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { configurable: true, value: () => false },
    releasePointerCapture: { configurable: true, value: () => {} },
    scrollIntoView: { configurable: true, value: () => {} },
  });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const property of [
    'hasPointerCapture',
    'releasePointerCapture',
    'scrollIntoView',
  ])
    Reflect.deleteProperty(HTMLElement.prototype, property);
});

function renderSettings() {
  const Component = Route.options.component;
  if (!Component) throw new Error('Settings route has no component');
  return render(<Component />);
}

describe('settings page interactions', () => {
  it('should edit numeric and select preferences, persist changes, and reset to defaults', async () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const sizes = screen.getAllByRole('spinbutton');
    fireEvent.change(sizes[0], { target: { value: '' } });
    fireEvent.change(sizes[0], { target: { value: '50' } });
    const selectors = screen.getAllByRole('combobox');
    fireEvent.keyDown(selectors[0], { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: 'iso' }));
    fireEvent.keyDown(selectors[1], { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: 'true' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getAllByText('50')).toHaveLength(2);
    expect(screen.getByText('iso')).toBeTruthy();
    expect(screen.getAllByText(/default:/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByText('absolute')).toBeTruthy();
  });
  it('should validate pasted imports, clear errors on edits, cancel and apply valid JSON', () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect(
      (screen.getByRole('button', { name: 'Apply' }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '{broken' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByText(/Invalid JSON/)).toBeTruthy();
    fireEvent.change(textarea, { target: { value: '{"pageSize":50}' } });
    expect(screen.queryByText(/Invalid JSON/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getAllByText('50')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'discard me' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
  });
  it('should read uploaded JSON into the import editor before applying it', async () => {
    const { container } = renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    const fileInput = container.querySelector('input[type=file]');
    if (!(fileInput instanceof HTMLInputElement))
      throw new Error('Missing settings upload');
    const click = vi.spyOn(fileInput, 'click');
    fireEvent.click(screen.getByRole('button', { name: 'Choose File' }));
    expect(click).toHaveBeenCalledOnce();
    fireEvent.change(fileInput, { target: { files: [] } });
    fireEvent.change(fileInput, {
      target: {
        files: [
          new File(['{"pageSize":100}'], 'settings.json', {
            type: 'application/json',
          }),
        ],
      },
    });
    await waitFor(() =>
      expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(
        '{"pageSize":100}'
      )
    );
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByText('100')).toBeTruthy();
  });
  it('should download current settings and release the temporary object URL', () => {
    const createObjectURL = vi.fn(() => 'blob:settings');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal(
      'URL',
      new Proxy(URL, {
        get(target, property, receiver) {
          if (property === 'createObjectURL') return createObjectURL;
          if (property === 'revokeObjectURL') return revokeObjectURL;
          return Reflect.get(target, property, receiver);
        },
      })
    );
    const download = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(download).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:settings');
  });
});
