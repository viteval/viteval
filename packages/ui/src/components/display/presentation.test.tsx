// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { getScoreBadge, getStatusBadge } from '@/lib/badges';
import { StatRow } from '../stat-row';
import { Duration } from './duration';
import { ProviderBadge } from './provider-badge';
import { detectFileType } from './file-icon';

afterEach(cleanup);

describe('evaluation summary presentation', () => {
  it('should classify extensionless files without guessing a known language', () => {
    expect(detectFileType('Makefile')).toBe('file');
    expect(detectFileType('')).toBe('file');
  });
  it('should display an unrecognized status and score threshold equality without mislabeling failure', () => {
    render(
      <>
        {getStatusBadge('cancelled')}
        {getScoreBadge(0.5, 0.5)}
        {getScoreBadge(0.4, 0.5)}
      </>
    );
    expect(screen.getByText('cancelled')).toBeTruthy();
    expect(screen.getByText('0.500').getAttribute('data-variant')).toBe(
      'success'
    );
    expect(screen.getByText('0.400').getAttribute('data-variant')).toBe(
      'destructive'
    );
  });
  it('should render inline statistics without a card wrapper and include the requested duration icon', () => {
    const { container } = render(
      <StatRow
        variant="inline"
        items={[{ label: 'Duration', value: <Duration ms={1000} showIcon /> }]}
      />
    );
    expect(screen.getByText('1.00s')).toBeTruthy();
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelector('[data-slot=card]')).toBeNull();
  });
  it('should render the configured provider identity', () => {
    render(<ProviderBadge provider="POSTGRES" />);
    expect(screen.getByText('Postgres')).toBeTruthy();
  });
});
