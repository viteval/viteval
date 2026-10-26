/**
 * Floating evaluation and Vitest layers, drawn as a compact isometric stack.
 * @returns Decorative artwork for the familiar-tooling feature.
 * @example
 * <ToolingScene />
 */
export function ToolingScene() {
  return (
    <div className="vv-scene vv-scene--tooling" aria-hidden="true">
      <div className="vv-stack">
        <div className="vv-stack__layer vv-stack__layer--base">
          <span className="vv-stack__label">VITEST</span>
          <svg viewBox="0 0 64 64" fill="none">
            <path d="m36 4-17 25h15l-7 22 26-30H37z" fill="#fcc82a" />
            <path d="m7 36 16 16 32-32" stroke="#a3e635" strokeWidth="5" />
          </svg>
        </div>
        <div className="vv-stack__guide" />
        <div className="vv-stack__layer vv-stack__layer--top">
          <span className="vv-stack__label">AGENT.EVAL.TS</span>
          <span className="vv-stack__code">{'{ ✓ }'}</span>
        </div>
      </div>
      <span className="vv-scene__caption">
        Same runner. A new kind of test.
      </span>
    </div>
  );
}

/**
 * Shows illustrative scorer values with staggered progress and pass states.
 * @returns Decorative scoring preview, not measured product output.
 * @example
 * <ScoringScene />
 */
export function ScoringScene() {
  return (
    <div className="vv-scene vv-scene--scores" aria-hidden="true">
      <div className="vv-scoreboard">
        <div className="vv-scene__chrome">
          <span>scorers</span>
          <span>example run</span>
        </div>
        {[
          { name: 'exactMatch', value: '1.00', width: '100%', tone: 'green' },
          {
            name: 'answerSimilarity',
            value: '0.92',
            width: '92%',
            tone: 'purple',
          },
          { name: 'yourScorer', value: '0.85', width: '85%', tone: 'gold' },
        ].map(({ name, value, width, tone }) => (
          <div className={`vv-score vv-score--${tone}`} key={name}>
            <div className="vv-score__label">
              <span>{name}</span>
              <span>
                {value} <b>✓</b>
              </span>
            </div>
            <div className="vv-score__track">
              <span style={{ width }} />
            </div>
          </div>
        ))}
      </div>
      <span className="vv-scene__caption">
        Your criteria. One clear result.
      </span>
    </div>
  );
}

/**
 * A local terminal preview with sequenced case results and a saved report.
 * @returns Decorative local-results terminal.
 * @example
 * <LocalScene />
 */
export function LocalScene() {
  return (
    <div className="vv-scene vv-scene--local" aria-hidden="true">
      <div className="vv-local-terminal">
        <div className="vv-scene__chrome">
          <span>~/my-agent</span>
          <span>local</span>
        </div>
        <div className="vv-local-terminal__body">
          <div>
            <span className="vv-text-muted">$</span> viteval run
          </div>
          <div className="vv-terminal-line vv-terminal-line--one">
            <b>✓</b> workspace-invites <span>passed</span>
          </div>
          <div className="vv-terminal-line vv-terminal-line--two">
            <b>✓</b> api-rate-limits <span>passed</span>
          </div>
          <div className="vv-terminal-line vv-terminal-line--three">
            <b>✓</b> retention-policy <span>passed</span>
          </div>
          <div className="vv-terminal-line vv-terminal-line--saved">
            <span>↳</span> .viteval/results/
          </div>
        </div>
      </div>
      <span className="vv-scene__caption">
        On your machine. No hosted account.
      </span>
    </div>
  );
}

/**
 * Connects a central evaluation to local, CI, and private runners.
 * @returns Decorative infrastructure diagram with animated connection paths.
 * @example
 * <RunnersScene />
 */
export function RunnersScene() {
  return (
    <div className="vv-scene vv-scene--runners" aria-hidden="true">
      <svg className="vv-runner-map" viewBox="0 0 400 240" fill="none">
        <defs>
          <linearGradient id="vv-beam" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#168DFA" />
            <stop offset="1" stopColor="#12D9E9" />
          </linearGradient>
        </defs>
        <g className="vv-runner-map__tracks">
          <path d="M200 120 80 55M200 120l120-65M200 120v75" />
        </g>
        <g className="vv-runner-map__beams" stroke="url(#vv-beam)">
          <path d="M200 120 80 55" pathLength="100" />
          <path d="M200 120l120-65" pathLength="100" />
          <path d="M200 120v75" pathLength="100" />
        </g>
        <g className="vv-runner-map__node">
          <rect x="38" y="26" width="84" height="50" rx="6" />
          <text x="80" y="56">
            LAPTOP
          </text>
        </g>
        <g className="vv-runner-map__node">
          <rect x="278" y="26" width="84" height="50" rx="6" />
          <text x="320" y="56">
            CI
          </text>
        </g>
        <g className="vv-runner-map__node">
          <rect x="147" y="185" width="106" height="40" rx="6" />
          <text x="200" y="210">
            PRIVATE
          </text>
        </g>
        <path
          className="vv-runner-map__depth"
          d="m200 79 61 35v17l-61 35-61-35v-17z"
        />
        <path className="vv-runner-map__hub" d="m200 79 61 35-61 35-61-35z" />
        <path d="m183 114 12 8 23-16" stroke="var(--vv-cyan)" strokeWidth="3" />
      </svg>
      <span className="vv-scene__caption">Same evals. Wherever you run.</span>
    </div>
  );
}
