/**
 * Floating evaluation and Vitest layers, drawn as a compact isometric stack.
 * @param options - Whether to show the Viteval brand mark on the upper layer.
 * @returns Decorative artwork for the familiar-tooling feature.
 * @example
 * <ToolingScene />
 */
export function ToolingScene({
  brandMark = false,
}: { brandMark?: boolean } = {}) {
  return (
    <div className="vv-scene vv-scene--tooling" aria-hidden="true">
      <div className="vv-stack">
        <div className="vv-stack__layer vv-stack__layer--base">
          <StackShine />
          <span className="vv-stack__label">VITEST</span>
          <img src="/assets/vitest-mark.svg" width="58" height="56" alt="" />
        </div>
        <div className="vv-stack__guide" />
        <div className="vv-stack__layer vv-stack__layer--top">
          <StackShine />
          <span className="vv-stack__label">
            {brandMark ? 'VITEVAL' : 'AGENT.EVAL.TS'}
          </span>
          <span className="vv-stack__code">
            {brandMark ? (
              <img
                src="/assets/viteval-flask.svg"
                width="64"
                height="64"
                alt=""
              />
            ) : (
              '{ ✓ }'
            )}
          </span>
        </div>
      </div>
      <span className="vv-scene__caption">
        Evaluation execution, powered by Vitest.
      </span>
    </div>
  );
}

function StackShine() {
  return (
    <svg className="vv-stack__shine" viewBox="0 0 160 160" fill="none">
      <rect x="1" y="1" width="158" height="158" rx="11" pathLength="100" />
    </svg>
  );
}

/**
 * Shows scoring methods with staggered decorative tracks.
 * @returns A diagram of deterministic, embedding, and custom scoring.
 * @example
 * <ScoringScene />
 */
export function ScoringScene() {
  return (
    <div className="vv-scene vv-scene--scores" aria-hidden="true">
      <div className="vv-scoreboard vv-hover-shine">
        <div className="vv-scene__chrome">
          <span>scorers</span>
          <span>scoring methods</span>
        </div>
        {[
          {
            name: 'exactMatch',
            value: 'deterministic',
            width: '100%',
            tone: 'green',
          },
          {
            name: 'answerSimilarity',
            value: 'embeddings',
            width: '92%',
            tone: 'purple',
          },
          { name: 'yourScorer', value: 'custom', width: '85%', tone: 'gold' },
        ].map(({ name, value, width, tone }) => (
          <div className={`vv-score vv-score--${tone}`} key={name}>
            <div className="vv-score__label">
              <span>{name}</span>
              <span>{value}</span>
            </div>
            <div className="vv-score__track">
              <span style={{ width }} />
            </div>
          </div>
        ))}
      </div>
      <span className="vv-scene__caption">Built-in and custom scorers</span>
    </div>
  );
}

/**
 * Saves dataset and result files into changing storage destinations.
 * @returns A file-saving animation with local, cloud, and hosted options.
 * @example
 * <LocalScene />
 */
export function LocalScene() {
  return (
    <div className="vv-scene vv-scene--storage" aria-hidden="true">
      <div className="vv-file-save">
        <div className="vv-file-save__files">
          {[
            { label: 'DATASET', name: 'support-routing.json' },
            { label: 'RESULTS', name: 'run-results.json' },
          ].map(({ label, name }) => (
            <div className="vv-file-save__file" key={label}>
              <span className="vv-file-save__type">{'{ }'}</span>
              <span>{label}</span>
              <span className="vv-file-save__filename">{name}</span>
            </div>
          ))}
        </div>
        <div className="vv-file-save__drawer">
          {[
            {
              label: 'LOCAL FILES',
              datasets: 'Local JSON',
              results: 'Local JSON',
            },
            {
              label: 'CLOUD DATASETS',
              datasets: 'S3 / GCS',
              results: 'Local JSON',
            },
            {
              label: 'EVAL PLATFORMS',
              datasets: 'Braintrust',
              results: 'Langfuse',
            },
          ].map(({ label, datasets, results }, index) => (
            <div
              className="vv-file-save__destination"
              key={label}
              style={{ animationDelay: `${index * 4}s` }}
            >
              <div className="vv-file-save__destination-title">
                <span>{label}</span>
                <span className="vv-file-save__saved">Saved ✓</span>
              </div>
              <div className="vv-file-save__row">
                <span>Datasets</span>
                <span>{datasets}</span>
              </div>
              <div className="vv-file-save__row">
                <span>Results</span>
                <span>{results}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="vv-scene__caption">
        Local files or a supported provider.
      </span>
    </div>
  );
}

/**
 * Shows the same evaluation command running across three environments.
 * @returns Laptop, CI, and cloud tiles with staggered execution highlights.
 * @example
 * <RunnersScene />
 */
export function RunnersScene() {
  return (
    <div className="vv-execution" aria-hidden="true">
      <div className="vv-execution__command">
        <span>❯</span> <code>viteval run</code>
      </div>
      <div className="vv-execution__environments">
        {[
          {
            label: 'Laptop',
            icon: (
              <>
                <rect x="9" y="10" width="30" height="23" rx="2" />
                <path d="m9 33-5 6h40l-5-6M20 36h8m-12-18 4 4-4 4m9 0h7" />
              </>
            ),
          },
          {
            label: 'CI',
            icon: (
              <>
                <rect x="7" y="8" width="34" height="32" rx="3" />
                <path d="M7 17h34m-26 12 6 6 12-12" />
              </>
            ),
          },
          {
            label: 'Your cloud',
            icon: (
              <>
                <path d="M14 35h22a8 8 0 0 0 0-16h-1a12 12 0 0 0-23-2 9 9 0 0 0 2 18Z" />
                <path d="m18 25 5 5 9-10" />
              </>
            ),
          },
        ].map(({ label, icon }, index) => (
          <div
            className="vv-execution__environment vv-hover-shine"
            key={label}
            style={{ animationDelay: `${index * -3}s` }}
          >
            <svg viewBox="0 0 48 48" fill="none">
              {icon}
            </svg>
            <span>{label}</span>
            <span className="vv-execution__status">✓ Passed</span>
          </div>
        ))}
      </div>
      <p className="vv-execution__caption">Same evals. Your infrastructure.</p>
    </div>
  );
}
