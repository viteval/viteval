import { InView } from './in-view';

import './stack-scene.css';
import './motion.css';

// Model marks: LobeHub lobe-icons (MIT); see model-marks-license.md.
const MODEL_MARKS = [
  {
    name: 'OpenAI',
    paths: [
      'M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z',
    ],
  },
  {
    name: 'Kimi',
    paths: [
      'M21.846 0a1.923 1.923 0 110 3.846H20.15a.226.226 0 01-.227-.226V1.923C19.923.861 20.784 0 21.846 0z',
      'M11.065 11.199l7.257-7.2c.137-.136.06-.41-.116-.41H14.3a.164.164 0 00-.117.051l-7.82 7.756c-.122.12-.302.013-.302-.179V3.82c0-.127-.083-.23-.185-.23H3.186c-.103 0-.186.103-.186.23V19.77c0 .128.083.23.186.23h2.69c.103 0 .186-.102.186-.23v-3.25c0-.069.025-.135.069-.178l2.424-2.406a.158.158 0 01.205-.023l6.484 4.772a7.677 7.677 0 003.453 1.283c.108.012.2-.095.2-.23v-3.06c0-.117-.07-.212-.164-.227a5.028 5.028 0 01-2.027-.807l-5.613-4.064c-.117-.078-.132-.279-.028-.381z',
    ],
  },
  {
    name: 'GLM / Z.ai',
    paths: [
      'M12.105 2L9.927 4.953H.653L2.83 2h9.276zM23.254 19.048L21.078 22h-9.242l2.174-2.952h9.244zM24 2L9.264 22H0L14.736 2H24z',
    ],
  },
] as const;

const CONNECTIONS = [
  'M72 92V112Q72 126 88 126H212Q240 126 240 144',
  'M240 92V144',
  'M408 92V112Q408 126 392 126H268Q240 126 240 144',
  'M150 190H194',
  'M330 190H286',
  'M240 236Q240 254 212 254H88Q72 254 72 270V294',
  'M240 236V294',
  'M240 236Q240 254 268 254H392Q408 254 408 270V294',
] as const;

/**
 * Illustrates independent choices of model clients, scorers, and storage.
 * @returns A responsive stack diagram with reduced-motion support.
 * @example
 * <StackScene />
 */
export function StackScene() {
  return (
    <InView fallbackInView>
      {({ ref, inView }) => (
        <div className="vv-stack-scene" ref={ref} data-motion-visible={inView}>
          <svg
            viewBox="0 0 480 388"
            role="img"
            aria-label="OpenAI, Kimi, and GLM clients connect to Viteval, with judge models and custom scorers, and Braintrust, Langfuse, or local JSON storage."
          >
            <text
              className="vv-stack-scene__caption"
              x="240"
              y="18"
              textAnchor="middle"
            >
              MODELS
            </text>
            {CONNECTIONS.map((d, index) => (
              <g key={d}>
                <path className="vv-stack-scene__connection" d={d} />
                <path
                  className="vv-stack-scene__pulse"
                  d={d}
                  pathLength="100"
                  style={{ animationDelay: `${index * -0.7}s` }}
                />
              </g>
            ))}
            {MODEL_MARKS.map(({ name, paths }, index) => (
              <g key={name} transform={`translate(${8 + index * 168} 34)`}>
                <rect
                  className="vv-stack-scene__tile"
                  width="128"
                  height="58"
                  rx="8"
                />
                <svg
                  x="12"
                  y="17"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  fillRule="evenodd"
                >
                  {paths.map((d) => (
                    <path d={d} key={d} />
                  ))}
                </svg>
                <text x="47" y="34">
                  {name}
                </text>
              </g>
            ))}
            <circle className="vv-stack-scene__hub" cx="240" cy="190" r="46" />
            <image
              href="/assets/viteval-flask.svg"
              x="214"
              y="158"
              width="52"
              height="64"
            />
            <g transform="translate(4 162)">
              <rect
                className="vv-stack-scene__tile"
                width="146"
                height="56"
                rx="8"
              />
              <text className="vv-stack-scene__code" x="14" y="34">
                {'>_'}
              </text>
              <text x="47" y="34">
                Judge model
              </text>
            </g>
            <g transform="translate(330 162)">
              <rect
                className="vv-stack-scene__tile"
                width="146"
                height="56"
                rx="8"
              />
              <text className="vv-stack-scene__code" x="12" y="34">
                {'{}'}
              </text>
              <text x="43" y="34">
                Custom scorer
              </text>
            </g>
            {[
              {
                name: 'Braintrust',
                src: '/assets/provider-braintrust.svg',
                mono: true,
              },
              {
                name: 'Langfuse',
                src: '/assets/provider-langfuse.svg',
                mono: false,
              },
              { name: 'Local JSON', src: null, mono: false },
            ].map(({ name, src, mono }, index) => (
              <g key={name} transform={`translate(${8 + index * 168} 294)`}>
                <rect
                  className="vv-stack-scene__tile"
                  width="128"
                  height="58"
                  rx="8"
                />
                {src ? (
                  <image
                    className={mono ? 'vv-stack-scene__mono' : undefined}
                    href={src}
                    x="12"
                    y="19"
                    width="22"
                    height="22"
                  />
                ) : (
                  <text className="vv-stack-scene__code" x="10" y="35">
                    {'{}'}
                  </text>
                )}
                <text x="42" y="34">
                  {name}
                </text>
              </g>
            ))}
            <text
              className="vv-stack-scene__caption"
              x="240"
              y="378"
              textAnchor="middle"
            >
              STORAGE
            </text>
          </svg>
        </div>
      )}
    </InView>
  );
}
