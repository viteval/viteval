import { CTA, PageRail } from '@ciderpress/ui/theme';
import type { ReactNode } from 'react';

import './hero-background.css';
import './features-page.css';

/**
 * Frames the features page with the homepage's shared rails and design tokens.
 * @param props - Feature descriptions and decorative motion.
 * @returns The feature detail sections and getting-started action.
 * @example
 * <FeaturesPage>{content}</FeaturesPage>
 */
export function FeaturesPage({ children }: { children: ReactNode }) {
  return (
    <PageRail>
      <main className="vv-features-page">{children}</main>
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

/**
 * Displays an isometric feature illustration in the homepage's visual style.
 * @param props - The feature to illustrate.
 * @returns A decorative CSS animation with a reduced-motion fallback.
 * @example
 * <FeatureMotion kind="tooling" />
 */
export function FeatureMotion({
  kind,
}: {
  kind: 'tooling' | 'scoring' | 'local' | 'runners';
}) {
  const artwork = {
    tooling: (
      <>
        <path
          className="vv-motion__edge"
          d="m74 156 126 67 126-67v14l-126 67-126-67z"
        />
        <path
          className="vv-motion__surface"
          d="m74 156 126-67 126 67-126 67z"
        />
        <g className="vv-motion__tile vv-motion__tile--tests">
          <path
            className="vv-motion__edge"
            d="m90 117 73 39 60-32v10l-60 32-73-39z"
          />
          <path className="vv-motion__surface" d="m90 117 60-32 73 39-60 32z" />
          <path className="vv-motion__accent" d="m128 116 18 10 32-17" />
          <text x="113" y="145" transform="rotate(28 113 145)">
            TEST
          </text>
        </g>
        <g className="vv-motion__tile vv-motion__tile--evals">
          <path
            className="vv-motion__edge"
            d="m185 137 73 39 60-32v10l-60 32-73-39z"
          />
          <path
            className="vv-motion__surface vv-motion__surface--blue"
            d="m185 137 60-32 73 39-60 32z"
          />
          <path
            className="vv-motion__accent"
            d="m226 134-9 5 9 5m32-2 9-5-9-5"
          />
          <text x="210" y="164" transform="rotate(28 210 164)">
            EVAL
          </text>
        </g>
      </>
    ),
    scoring: (
      <>
        <path
          className="vv-motion__edge"
          d="m65 173 189-100 82 44v14L147 231l-82-44z"
        />
        <path
          className="vv-motion__surface"
          d="m65 173 189-100 82 44-189 100z"
        />
        <path className="vv-motion__rail" d="m99 173 200-106" />
        {[0, 1, 2].map((step) => (
          <g key={step} transform={`translate(${step * 63} ${step * -33})`}>
            <path
              className="vv-motion__gate"
              d="M105 177v-80l66 35v80l-8-4v-70l-50-27v70z"
            />
            <path className="vv-motion__accent" d="m120 119 34 18" />
          </g>
        ))}
        <g className="vv-motion__sample">
          <path
            className="vv-motion__surface--blue"
            d="m89 153 12-6 12 6v14l-12 6-12-6z"
          />
          <path className="vv-motion__accent" d="m89 153 12 7 12-7m-12 7v13" />
        </g>
      </>
    ),
    local: (
      <>
        <path
          className="vv-motion__surface"
          d="m103 160 97-52 97 52v38l-97 52-97-52z"
        />
        <path className="vv-motion__edge" d="m103 160 97 52 97-52m-97 52v38" />
        <path className="vv-motion__rail" d="m123 159 77-41 77 41-77 41z" />
        <g className="vv-motion__pages">
          <path
            className="vv-motion__edge"
            d="m134 105 66-35 66 35v12l-66 35-66-35z"
          />
          <path
            className="vv-motion__surface vv-motion__surface--blue"
            d="m134 105 66-35 66 35-66 35z"
          />
          <path
            className="vv-motion__accent"
            d="m170 103 36 19m-23-26 36 19m-23-26 36 19"
          />
        </g>
        <path className="vv-motion__accent" d="m179 219 7 4m7 4 7 4" />
      </>
    ),
    runners: (
      <>
        <path
          className="vv-motion__surface"
          d="m55 179 230-122 60 32v32L115 243l-60-32z"
        />
        <path
          className="vv-motion__edge"
          d="m55 179 60 32L345 89m-230 122v32"
        />
        <path className="vv-motion__rail" d="m78 202 244-130" />
        <path
          className="vv-motion__signal"
          d="m78 202 244-130"
          pathLength="100"
        />
        {[0, 1, 2].map((step) => (
          <g
            className="vv-motion__machine"
            key={step}
            transform={`translate(${step * 78} ${step * -41})`}
          >
            <path
              className="vv-motion__edge"
              d="m89 139 25 13 25-13v40l-25 13-25-13z"
            />
            <path
              className="vv-motion__surface"
              d="m89 139 25-13 25 13-25 13z"
            />
            <path className="vv-motion__accent" d="m97 162 9 5m-9 4 9 5" />
            <circle className="vv-motion__status" cx="126" cy="171" r="2" />
          </g>
        ))}
      </>
    ),
  };

  return (
    <div className={`vv-motion vv-motion--${kind}`} aria-hidden="true">
      <svg viewBox="0 0 400 280" fill="none">
        <path
          className="vv-motion__ground"
          d="m40 168 160 85 160-85M70 152l160 85M100 136l160 85M130 120l160 85M160 104l160 85M70 184l160-85M100 200l160-85M130 216l160-85M160 232l160-85"
        />
        {artwork[kind]}
      </svg>
    </div>
  );
}
