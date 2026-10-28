// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ChartContainer,
  ChartLegendContent,
  ChartStyle,
  ChartTooltipContent,
  type ChartConfig,
} from './chart';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', function () {
    return { observe() {}, unobserve() {}, disconnect() {} };
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 400, 200)
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderChart(children: ReactNode, config: ChartConfig = {}) {
  return render(
    <ChartContainer config={config} id="test-chart">
      <div>{children}</div>
    </ChartContainer>
  );
}

describe('chart presentation contracts', () => {
  it.each(['line', 'dashed'] as const)(
    'should nest single-series labels next to %s indicators',
    (indicator) => {
      renderChart(
        <ChartTooltipContent
          active
          label="Nested label"
          indicator={indicator}
          payload={[{ graphicalItemId: 'one', name: 'one', value: 1 }]}
        />
      );
      expect(screen.getByText('Nested label')).toBeTruthy();
      expect(screen.getByText('one')).toBeTruthy();
      expect(screen.getByText('1')).toBeTruthy();
    }
  );
  it('should omit an intentionally empty theme color without discarding the other theme', () => {
    const { container } = render(
      <ChartStyle
        id="partial"
        config={{ series: { theme: { light: '', dark: '#ffffff' } } }}
      />
    );
    expect(container.textContent?.match(/--color-series/g)).toHaveLength(1);
    expect(container.textContent).toContain('#ffffff');
  });
  it('should scope series colors by chart ID and theme and omit colorless definitions', () => {
    const { container, rerender } = render(
      <ChartStyle
        id="unique"
        config={{
          passed: { color: '#00ff00' },
          failed: { theme: { light: '#ff0000', dark: '#880000' } },
          invisible: { label: 'No color' },
        }}
      />
    );
    const css = container.querySelector('style')?.textContent;
    expect(css).toContain('[data-chart=unique]');
    expect(css).toContain('--color-passed: #00ff00');
    expect(css).toContain('--color-failed: #ff0000');
    expect(css).toContain('--color-failed: #880000');
    expect(css).not.toContain('--color-invisible');
    rerender(
      <ChartStyle id="empty" config={{ series: { label: 'No color' } }} />
    );
    expect(container.querySelector('style')).toBeNull();
  });
  it('should hide inactive or empty tooltips and legends', () => {
    const { container, rerender } = render(
      <>
        <ChartTooltipContent
          active={false}
          payload={[{ graphicalItemId: 'passed', name: 'passed', value: 2 }]}
        />
        <ChartLegendContent payload={[]} />
      </>
    );
    expect(container.textContent).toBe('');
    rerender(<ChartTooltipContent active payload={[]} />);
    expect(container.textContent).toBe('');
  });
  it.each(['dot', 'line', 'dashed'] as const)(
    'should render %s indicators, labels and locale-formatted values',
    (indicator) => {
      renderChart(
        <ChartTooltipContent
          active
          label="Run one"
          indicator={indicator}
          payload={[
            {
              graphicalItemId: 'passed',
              name: 'passed',
              dataKey: 'passed',
              value: 1234,
              color: '#00ff00',
            },
            {
              graphicalItemId: 'hidden',
              name: 'hidden',
              type: 'none',
              value: 99,
            },
          ]}
        />,
        { passed: { label: 'Passed' } }
      );
      expect(screen.getByText('Run one')).toBeTruthy();
      expect(screen.getByText('Passed')).toBeTruthy();
      expect(screen.getByText((1234).toLocaleString())).toBeTruthy();
      expect(screen.queryByText('hidden')).toBeNull();
    }
  );
  it('should support custom label/value formatters and caller-selected payload keys', () => {
    renderChart(
      <ChartTooltipContent
        active
        labelKey="labelType"
        nameKey="series"
        labelFormatter={(label) => `Run: ${String(label)}`}
        formatter={(value, name) => (
          <strong>
            {name}: {String(value)} cases
          </strong>
        )}
        payload={[
          {
            graphicalItemId: 'raw',
            name: 'raw',
            value: 3,
            payload: { labelType: 'passed', series: 'failed', fill: '#ff0000' },
          },
        ]}
      />,
      {
        passed: { label: 'Passing results' },
        failed: { label: 'Failing results' },
      }
    );
    expect(screen.getByText('Run: Passing results')).toBeTruthy();
    expect(screen.getByText('raw: 3 cases')).toBeTruthy();
  });
  it('should use configured icons and nested payload labels while honoring hidden labels', () => {
    const icon = () => <svg aria-label="Series icon" />;
    renderChart(
      <>
        <ChartTooltipContent
          active
          labelKey="category"
          payload={[
            {
              graphicalItemId: 'category',
              dataKey: 'category',
              name: 'category',
              value: 'complete',
              payload: { category: 'passed' },
            },
          ]}
        />
        <ChartTooltipContent
          active
          hideLabel
          hideIndicator
          payload={[
            { graphicalItemId: 'other', dataKey: 'other', value: 0 },
            { graphicalItemId: 'none', dataKey: 'none', value: undefined },
          ]}
        />
      </>,
      { passed: { label: 'Passed', icon } }
    );
    expect(screen.getByLabelText('Series icon')).toBeTruthy();
    expect(screen.getAllByText('Passed')).toHaveLength(2);
    expect(screen.getByText('complete')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
  });
  it('should render legends with custom series keys, icons and hidden series filtered out', () => {
    renderChart(
      <>
        <ChartLegendContent
          verticalAlign="top"
          nameKey="value"
          payload={[
            { value: 'passed', dataKey: 'raw', color: '#00ff00' },
            { value: 'hidden', type: 'none' },
          ]}
        />
        <ChartLegendContent
          hideIcon
          payload={[{ value: 'failed', dataKey: 'failed', color: '#ff0000' }]}
        />
      </>,
      {
        passed: {
          label: 'Passed',
          icon: () => <svg aria-label="Legend icon" />,
        },
        failed: {
          label: 'Failed',
          icon: () => <svg aria-label="Hidden icon" />,
        },
      }
    );
    expect(screen.getByLabelText('Legend icon')).toBeTruthy();
    expect(screen.queryByLabelText('Hidden icon')).toBeNull();
    expect(screen.getByText('Passed')).toBeTruthy();
    expect(screen.getByText('Failed')).toBeTruthy();
    expect(screen.queryByText('hidden')).toBeNull();
  });
  it('should tolerate unnamed series and absent labels without inventing values', () => {
    renderChart(
      <>
        <ChartTooltipContent
          active
          payload={[
            { graphicalItemId: 'unknown', value: undefined, payload: null },
          ]}
        />
        <ChartLegendContent payload={[{ value: 'unknown' }]} />
      </>
    );
    expect(screen.queryByText('undefined')).toBeNull();
  });
});
