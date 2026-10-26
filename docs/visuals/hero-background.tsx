import { useEffect, useRef, useState } from 'react';

import GradientAscii from './react-bits/gradient-ascii';
import { GridScan } from './react-bits/grid-scan';

import './hero-background.css';

type HeroVariant = 'gradient-ascii' | 'grid-scan';

const ASCII_COLORS = ['#0B1016', '#123D62', '#168DFA', '#47A6FC', '#12D9E9'];
const VARIANTS = [
  { value: 'gradient-ascii', label: 'Gradient ASCII' },
  { value: 'grid-scan', label: 'Grid Scan' },
] as const;

/**
 * Renders the Grid Scan hero with motion and optional comparison controls.
 * @returns The decorative hero artwork and preview controls.
 * @example
 * <HeroBackground />
 */
export function HeroBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<HeroVariant>('grid-scan');
  const [isPreview, setIsPreview] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const syncVariant = () => {
      const requested = new URLSearchParams(window.location.search).get('hero');
      setVariant(
        requested === 'gradient-ascii' ? 'gradient-ascii' : 'grid-scan'
      );
      setIsPreview(requested === 'gradient-ascii' || requested === 'grid-scan');
    };
    syncVariant();
    window.addEventListener('popstate', syncVariant);
    // Ciderpress hides banner content from AT; this banner also owns controls.
    const container = rootRef.current?.parentElement;
    const previousHidden = container?.getAttribute('aria-hidden');
    container?.removeAttribute('aria-hidden');
    return () => {
      window.removeEventListener('popstate', syncVariant);
      if (previousHidden !== null && previousHidden !== undefined) {
        container?.setAttribute('aria-hidden', previousHidden);
      }
    };
  }, []);

  function selectVariant(nextVariant: HeroVariant) {
    setVariant(nextVariant);
    const url = new URL(window.location.href);
    url.searchParams.set('hero', nextVariant);
    window.history.replaceState(window.history.state, '', url);
  }

  return (
    <div className="viteval-hero-background" ref={rootRef}>
      <div className="viteval-hero-art" aria-hidden="true" data-hero={variant}>
        {variant === 'gradient-ascii' ? (
          <GradientAscii
            colors={ASCII_COLORS}
            shape="horizon"
            characters=" .:-=+*#%@"
            cellSize={10}
            glyphOpacity={0.9}
            gradientOpacity={0.3}
            glow={0.35}
            speed={0.4}
            grain={0.08}
            flicker={0.1}
            mouseInteraction
            clickEffect="none"
            intro={false}
            paused={paused}
            dpr={1}
          />
        ) : (
          <GridScan
            linesColor="#1D3E58"
            scanColor="#168DFA"
            cells={12}
            depth={3}
            scanDuration={3.5}
            scanDelay={1.5}
            scanDirection="pingpong"
            glow={0.2}
            reflection={0.06}
            parallax={0.3}
            enableWebcam={false}
            enableGyro={false}
            clickEffect="none"
            intro={false}
            paused={paused}
            dpr={1}
          />
        )}
      </div>
      <div className="viteval-hero-scrim" aria-hidden="true" />
      <div
        className="viteval-hero-controls"
        data-preview={isPreview}
        role="group"
        aria-label="Hero background controls"
      >
        {isPreview && (
          <span className="viteval-hero-controls__label">Background study</span>
        )}
        {isPreview &&
          VARIANTS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={variant === value}
              onClick={() => selectVariant(value)}
            >
              {label}
            </button>
          ))}
      </div>
      <div className="viteval-hero-motion">
        <button
          className="viteval-hero-motion__button"
          type="button"
          aria-label={paused ? 'Play motion' : 'Pause motion'}
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            {paused ? (
              <path d="M4 2.5v11L13 8z" />
            ) : (
              <path d="M4 3h3v10H4zm5 0h3v10H9z" />
            )}
          </svg>
        </button>
        <span className="viteval-hero-motion__tooltip" role="tooltip">
          {paused ? 'Play motion' : 'Pause motion'}
        </span>
      </div>
    </div>
  );
}
