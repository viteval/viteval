import { useEffect, useState } from 'react';
import { InView } from './in-view';

import './ci-scene.css';
import './motion.css';

const CHECK_COPY = {
  running: {
    summary: 'Some checks haven’t completed yet',
    count: '1 in progress check',
    detail: 'In progress — Running evaluations…',
    footer: 'Waiting for required checks to complete',
  },
  passed: {
    summary: 'All checks have passed',
    count: '1 successful check',
    detail: 'Successful in 1s — Evaluations passed',
    footer: 'All required checks have passed',
  },
} as const;

/**
 * Replays a GitHub pull-request check when it enters the viewport.
 * @returns An illustrative checks panel with reduced-motion support.
 * @example
 * <CiScene />
 */
export function CiScene() {
  return (
    <InView fallbackInView>
      {({ ref, inView }) => (
        <div ref={ref} data-motion-visible={inView}>
          <CiCheck inView={inView} />
        </div>
      )}
    </InView>
  );
}

function CiCheck({ inView }: { inView: boolean }) {
  const [status, setStatus] = useState<'running' | 'passed'>('running');
  const copy = CHECK_COPY[status];

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timeout: ReturnType<typeof setTimeout> | undefined;

    function updateStatus() {
      clearTimeout(timeout);
      if (reducedMotion.matches) {
        setStatus('passed');
        return;
      }
      setStatus('running');
      if (inView) timeout = setTimeout(() => setStatus('passed'), 1000);
    }

    updateStatus();
    reducedMotion.addEventListener('change', updateStatus);
    return () => {
      clearTimeout(timeout);
      reducedMotion.removeEventListener('change', updateStatus);
    };
  }, [inView]);

  return (
    <figure
      className="vv-ci-scene"
      data-status={status}
      role="img"
      aria-label={`GitHub pull-request checks: ${copy.detail}.`}
    >
      <figcaption className="vv-ci-scene__summary">
        <svg
          className="vv-ci-scene__pending"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          {status === 'passed' ? (
            <path d="m7 12 3 3 7-7" />
          ) : (
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          )}
        </svg>
        <div>
          <strong>{copy.summary}</strong>
          <span className="vv-ci-scene__muted">{copy.count}</span>
        </div>
      </figcaption>
      <div className="vv-ci-scene__check">
        <svg
          className="vv-ci-scene__check-status"
          viewBox="0 0 20 20"
          width="18"
          height="18"
          fill="none"
          aria-hidden="true"
        >
          {status === 'passed' ? (
            <path d="m4 10 4 4 8-9" />
          ) : (
            <circle className="vv-ci-scene__spinner" cx="10" cy="10" r="7" />
          )}
        </svg>
        <img
          className="vv-ci-scene__github"
          src="/assets/github-mark.svg"
          alt=""
          width="20"
          height="20"
        />
        <div className="vv-ci-scene__check-copy">
          <div className="vv-ci-scene__name">
            <strong>Agent evaluations / eval</strong>
            <span className="vv-ci-scene__required">Required</span>
          </div>
          <span className="vv-ci-scene__muted">{copy.detail}</span>
        </div>
        <span className="vv-ci-scene__details">Details</span>
      </div>
      <div className="vv-ci-scene__footer">
        <svg
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="none"
          aria-hidden="true"
        >
          {status === 'passed' ? (
            <path d="m3 8 3 3 7-7" />
          ) : (
            <>
              <rect x="3" y="7" width="10" height="7" rx="1" />
              <path d="M5 7V5a3 3 0 0 1 6 0v2" />
            </>
          )}
        </svg>
        {copy.footer}
      </div>
    </figure>
  );
}
