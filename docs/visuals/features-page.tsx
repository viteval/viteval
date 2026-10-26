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
 * Displays a straight-on feature illustration with restrained motion.
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
  const runnerIcons = {
    LAPTOP: (
      <>
        <rect
          className="vv-motion__screen"
          x="10"
          y="13"
          width="44"
          height="30"
          rx="2"
        />
        <path className="vv-motion__accent" d="m22 24 5 4-5 4m11 0h8" />
        <path className="vv-motion__divider" d="m10 43-5 7h54l-5-7M27 47h10" />
      </>
    ),
    CI: (
      <>
        <rect
          className="vv-motion__screen"
          x="9"
          y="10"
          width="46"
          height="42"
          rx="3"
        />
        <path className="vv-motion__divider" d="M9 20h46" />
        <path className="vv-motion__accent" d="m18 35 5 5 8-10m7 2h9m-9 7h6" />
      </>
    ),
    PRIVATE: (
      <>
        {[12, 34].map((y) => (
          <g key={y}>
            <rect
              className="vv-motion__screen"
              x="10"
              y={y}
              width="44"
              height="17"
              rx="2"
            />
            <path className="vv-motion__accent" d={`M17 ${y + 8}h14`} />
            <circle className="vv-motion__camera" cx="45" cy={y + 8} r="2" />
          </g>
        ))}
      </>
    ),
  };

  const artwork = {
    tooling: (
      <>
        <g className="vv-motion__tile vv-motion__tile--tests">
          <rect
            className="vv-motion__edge"
            x="70"
            y="70"
            width="116"
            height="142"
            rx="8"
          />
          <rect
            className="vv-motion__surface"
            x="70"
            y="66"
            width="116"
            height="142"
            rx="8"
          />
          <g transform="translate(96 115)">
            <path d="m36 4-17 25h15l-7 22 26-30H37z" fill="#fcc82a" />
            <path d="m7 36 16 16 32-32" stroke="#a3e635" strokeWidth="5" />
          </g>
          <text x="84" y="91">
            TEST
          </text>
        </g>
        <g className="vv-motion__tile vv-motion__tile--evals">
          <rect
            className="vv-motion__edge"
            x="214"
            y="70"
            width="116"
            height="142"
            rx="8"
          />
          <rect
            className="vv-motion__surface--blue"
            x="214"
            y="66"
            width="116"
            height="142"
            rx="8"
          />
          <g transform="translate(240 115)">
            <path
              className="vv-motion__accent"
              d="M12 2h28l12 12v44H12zM40 2v12h12M25 28l-7 7 7 7m14-14 7 7-7 7"
            />
          </g>
          <text x="228" y="91">
            EVAL
          </text>
        </g>
      </>
    ),
    scoring: (
      <>
        <g transform="translate(104 54)">
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
      <g>
        <path className="vv-motion__edge" d="M72 226h256v5l-8 4H80l-8-4z" />
        <path className="vv-motion__surface" d="M100 182h200l28 44H72z" />
        <path className="vv-motion__divider" d="M109 184h182" />
        <path className="vv-motion__keyboard" d="M111 188h178l14 23H97z" />
        <path
          className="vv-motion__divider"
          d="M107 196h186M102 204h196m-177-16-9 23m29-23-7 23m27-23-4 23m25-23-1 23m23-23 1 23m21-23 4 23m17-23 7 23m13-23 9 23"
        />
        <path
          className="vv-motion__divider"
          d="M179 216h42l3 7h-48zM183 226h34"
        />
        <g transform="translate(100 54)">
          <rect className="vv-motion__edge" width="200" height="128" rx="6" />
          <rect
            className="vv-motion__screen"
            x="7"
            y="8"
            width="186"
            height="111"
            rx="3"
          />
          <circle className="vv-motion__camera" cx="100" cy="4" r="1" />
          <svg
            x="20"
            y="26"
            width="160"
            height="80"
            viewBox="0 0 160 80"
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
      </g>
    ),
    runners: (
      <>
        <path
          className="vv-motion__rail"
          d="M109 126h180q26 0 26 26v30q0 22-22 22H109q-24 0-24-24v-30q0-24 24-24z"
        />
        <path
          className="vv-motion__signal"
          d="M109 126h180q26 0 26 26v30q0 22-22 22H109q-24 0-24-24v-30q0-24 24-24z"
          pathLength="100"
        />
        {(['LAPTOP', 'CI', 'PRIVATE'] as const).map((label, step) => (
          <g
            className="vv-motion__machine"
            key={label}
            transform={`translate(${77 + step * 90} 96)`}
          >
            <rect
              className="vv-motion__surface"
              width="64"
              height="64"
              rx="8"
            />
            {runnerIcons[label]}
            <circle className="vv-motion__status" cx="32" cy="-12" r="3" />
            <text x="32" y="84" textAnchor="middle">
              {label}
            </text>
          </g>
        ))}
      </>
    ),
  };

  return (
    <div className={`vv-motion vv-motion--${kind}`} aria-hidden="true">
      <svg viewBox="45 25 310 240" fill="none">
        {artwork[kind]}
      </svg>
    </div>
  );
}
