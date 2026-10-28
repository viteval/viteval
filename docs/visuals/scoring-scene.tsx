import { InView } from './in-view';

import './motion.css';
import './scoring-scene.css';

/**
 * Compares exact-match scoring with a criteria-based judge in a results inspector.
 * @returns Illustrative results that animate when visible and respect reduced motion.
 * @example
 * <ScoringScene />
 */
export function ScoringScene() {
  return (
    <InView fallbackInView>
      {({ ref, inView }) => (
        <figure className="vv-scoring" ref={ref} data-motion-visible={inView}>
          <figcaption className="vv-scoring__bar">
            <span>Results inspector</span>
          </figcaption>
          <section
            className="vv-scoring__case"
            aria-label="Exact match results"
          >
            <header className="vv-scoring__heading">
              <strong>Route a support ticket</strong>
              <span>Exact match</span>
            </header>
            <p className="vv-scoring__input">Cancel my subscription.</p>
            <dl className="vv-scoring__comparison">
              <div>
                <dt>Expected</dt>
                <dd>billing</dd>
              </div>
              <div className="vv-scoring__output">
                <dt>Output</dt>
                <dd className="vv-scoring__wrong">account</dd>
              </div>
            </dl>
            <div className="vv-scoring__result vv-scoring__result--exact">
              <span>ExactMatch</span>
              <strong className="vv-scoring__wrong">
                0.00 <small>Fail</small>
              </strong>
            </div>
          </section>
          <section className="vv-scoring__case" aria-label="LLM judge results">
            <header className="vv-scoring__heading">
              <strong>Answer a refund question</strong>
              <span>LLM judge</span>
            </header>
            <p className="vv-scoring__input">
              Can I get a refund? How long does it take?
            </p>
            <div className="vv-scoring__criteria">
              <span>Criteria</span>
              Cover eligibility and refund timing.
            </div>
            <div className="vv-scoring__output">
              <span className="vv-scoring__label">Output</span>
              <blockquote>You can request a refund within 30 days.</blockquote>
            </div>
            <div className="vv-scoring__result vv-scoring__result--judge">
              <span>Refund completeness</span>
              <strong>
                0.85 <small>/ 1.00</small>
              </strong>
            </div>
            <p className="vv-scoring__reason">
              Covers eligibility, but omits the refund timeline.
            </p>
          </section>
        </figure>
      )}
    </InView>
  );
}
