import { CTA, PageRail } from '@ciderpress/ui/theme';
import type { ReactNode } from 'react';

import './hero-background.css';
import './feature-panels.css';
import './features-page.css';

/**
 * Frames the features page with the homepage's shared rails and design tokens.
 * @param props - Highlighted MDX content and shared animated feature scenes.
 * @returns The feature detail sections and getting-started action.
 * @example
 * <FeaturesPage>{content}</FeaturesPage>
 */
export function FeaturesPage({ children }: { children: ReactNode }) {
  return (
    <PageRail>
      <main className="vv-features vv-features-page">{children}</main>
      <CTA
        title="Run your first evaluation."
        subtitle="Open source. No hosted account required."
        actions={[
          {
            theme: 'brand',
            text: 'Get started',
            link: '/guide/getting-started',
          },
        ]}
      />
    </PageRail>
  );
}
