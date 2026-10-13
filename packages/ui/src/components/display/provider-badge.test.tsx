// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProviderBadge } from '@/components/display/provider-badge';

afterEach(cleanup);

describe('ProviderBadge', () => {
  it.each(['constructor', 'toString', '__proto__'])(
    'should render unknown provider %s as its literal label',
    (provider) => {
      render(<ProviderBadge provider={provider} />);
      expect(screen.getByText(provider)).toBeTruthy();
    }
  );
});
