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
          <g transform="matrix(.8 .43 -.8 .43 151 88)">
            <path d="m36 4-17 25h15l-7 22 26-30H37z" fill="#fcc82a" />
            <path d="m7 36 16 16 32-32" stroke="#a3e635" strokeWidth="5" />
          </g>
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
          <g transform="matrix(.75 .4 -.75 .4 246 109)">
            <path
              className="vv-motion__accent"
              d="M12 2h28l12 12v44H12zM40 2v12h12M25 28l-7 7 7 7m14-14 7 7-7 7"
            />
          </g>
          <text x="210" y="164" transform="rotate(28 210 164)">
            EVAL
          </text>
        </g>
      </>
    ),
    scoring: (
      <>
        <g transform="matrix(.95 .38 -.48 .72 147 45)">
          <rect
            className="vv-motion__edge"
            x="0"
            y="8"
            width="192"
            height="170"
            rx="8"
          />
          <rect
            className="vv-motion__surface"
            width="192"
            height="170"
            rx="8"
          />
          <path className="vv-motion__divider" d="M0 30h192" />
          <text x="16" y="19">
            SCORER RESULTS
          </text>
          {['exactMatch', 'answerSimilarity', 'yourScorer'].map(
            (label, index) => (
              <g key={label} transform={`translate(16 ${47 + index * 37})`}>
                <rect
                  className="vv-motion__surface--blue"
                  width="20"
                  height="20"
                  rx="4"
                />
                <path
                  className="vv-motion__check"
                  d="m5 10 4 4 7-8"
                  style={{ animationDelay: `${index * 0.5}s` }}
                />
                <text x="32" y="14">
                  {label}
                </text>
              </g>
            )
          )}
        </g>
      </>
    ),
    local: (
      <>
        <path
          className="vv-motion__edge"
          d="m70 176 165 60 50-31v6l-50 31-165-60z"
        />
        <g transform="matrix(1 .36 -.9 .55 120 145)">
          <rect className="vv-motion__surface" width="165" height="56" rx="3" />
          <rect
            className="vv-motion__keyboard"
            x="13"
            y="6"
            width="139"
            height="24"
            rx="2"
          />
          <path
            className="vv-motion__divider"
            d="M14 14h137M14 22h137M29 6v24M47 6v24M65 6v24M83 6v24M101 6v24M119 6v24M137 6v24"
          />
          <rect
            className="vv-motion__divider"
            x="61"
            y="35"
            width="43"
            height="15"
            rx="2"
          />
        </g>
        <g transform="matrix(1 .36 0 1 120 55)">
          <rect
            className="vv-motion__edge"
            x="-3"
            y="-3"
            width="171"
            height="96"
            rx="6"
          />
          <rect className="vv-motion__screen" width="165" height="90" rx="4" />
          <circle className="vv-motion__camera" cx="82" cy="4" r="1" />
          <svg
            x="10"
            y="12"
            width="145"
            height="68"
            viewBox="0 0 145 68"
            overflow="hidden"
          >
            <text x="0" y="12">
              ~/my-agent
            </text>
            <path className="vv-motion__accent" d="m1 25 5 4-5 4m11 0h7" />
            <text x="27" y="33">
              viteval run
            </text>
            <g className="vv-motion__saved">
              <path className="vv-motion__accent" d="m1 48 4 4 7-8" />
              <text x="21" y="52">
                results saved locally
              </text>
            </g>
          </svg>
        </g>
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
        {['CI', 'NODE', 'PRIVATE'].map((label, step) => (
          <g
            className="vv-motion__machine"
            key={label}
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
            <path
              className="vv-motion__accent"
              d="m95 155 13 7m-13 1 13 7m-13 1 13 7"
            />
            <circle className="vv-motion__status" cx="126" cy="171" r="2" />
            <text x="90" y="207" transform="rotate(28 90 207)">
              {label}
            </text>
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
