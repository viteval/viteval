import { PageRail } from '@ciderpress/ui/theme';
import { useState } from 'react';

import './hero-background.css';
import './brand-page.css';

const COLORS = [
  { name: 'Background', hex: '#0B1016' },
  { name: 'Blue', hex: '#168DFA' },
  { name: 'Liquid', hex: '#032D54' },
  { name: 'Cyan', hex: '#12D9E9' },
  { name: 'Off-white', hex: '#F8FAFC' },
] as const;

const WORDMARKS = [
  { name: 'Dark surfaces', tone: 'dark', filename: 'viteval-wordmark.svg' },
  {
    name: 'Light surfaces',
    tone: 'light',
    filename: 'viteval-wordmark-light.svg',
  },
] as const;

const HEADING_SAMPLES = [
  { level: 'h1', label: 'H1 / 800 / 72px', text: 'Measure what matters.' },
  { level: 'h2', label: 'H2 / 750 / 48px', text: 'Your stack. Your evals.' },
  {
    level: 'h3',
    label: 'H3 / 700 / 36px',
    text: 'Evaluate any model or agent.',
  },
  { level: 'h4', label: 'H4 / 650 / 28px', text: 'Choose how you judge.' },
  { level: 'h5', label: 'H5 / 600 / 22px', text: 'Keep your data close.' },
  { level: 'h6', label: 'H6 / 600 / 18px', text: 'Inspect every result.' },
] as const;

/**
 * Approved Viteval identity with downloadable artwork and motion previews.
 * @returns The public brand reference.
 * @example
 * <BrandPage />
 */
export function BrandPage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoaderPlaying, setIsLoaderPlaying] = useState(true);

  return (
    <PageRail>
      <main className="vv-brand">
        <header className="vv-brand__intro">
          <p className="vv-eyebrow">Viteval / Brand & assets</p>
          <h1>Brand assets</h1>
          <p>
            Lowercase lettering, a blue flask, deep navy liquid, and cyan
            bubbles. Download the approved artwork for documentation,
            integrations, and projects.
          </p>
          <p>
            Viteval is an independent open-source project. It is not affiliated
            with, endorsed by, or supported by VoidZero.
          </p>
          <nav aria-label="Brand sections">
            <a href="#logos">Logos</a>
            <a href="#icons">Icons & motion</a>
            <a href="#loader">Loader</a>
            <a href="#colors">Colors</a>
            <a href="#typography">Typography & usage</a>
          </nav>
        </header>

        <section id="logos" aria-labelledby="brand-logos">
          <h2 id="brand-logos">The wordmark</h2>
          <p>
            A standalone flask leads lowercase lettering: vit in a neutral
            color, eval in blue. Keep the tight gap and vertical alignment. No
            brackets, circle, or background tile.
          </p>
          <div className="vv-brand__grid">
            {WORDMARKS.map(({ name, tone, filename }) => (
              <article className="vv-brand__asset" key={filename}>
                <div className={`vv-brand__preview vv-brand__preview--${tone}`}>
                  <img
                    src={`/assets/${filename}`}
                    alt={`Viteval wordmark for ${name.toLowerCase()}`}
                    width="1112"
                    height="377"
                  />
                </div>
                <div className="vv-brand__asset-label">
                  <h3>{name}</h3>
                  <a href={`/assets/${filename}`} download>
                    Download SVG
                  </a>
                </div>
              </article>
            ))}
          </div>
          <p className="vv-brand__note">
            Transparent backgrounds and outlined lettering. No installed fonts
            or embedded images required. Use these files rather than recreating
            the logo with text.
          </p>
        </section>

        <section id="icons" aria-labelledby="brand-icons">
          <h2 id="brand-icons">The flask</h2>
          <p>
            The standalone mark for app icons, favicons, and loading states. A
            blue outline, completely full deep navy liquid, and four cyan
            bubbles—no liquid wave.
          </p>
          <div className="vv-brand__grid">
            <article className="vv-brand__asset">
              <div className="vv-brand__preview vv-brand__preview--dark vv-brand__icon-sizes">
                {[16, 24, 32, 64].map((size) => (
                  <figure key={size}>
                    <img
                      src="/assets/viteval-flask.svg"
                      alt={`Flask at ${size} pixels`}
                      width={size}
                      height={size}
                    />
                    <figcaption>{size}px</figcaption>
                  </figure>
                ))}
              </div>
              <div className="vv-brand__asset-label">
                <h3>App icon</h3>
                <a href="/assets/viteval-flask.svg" download>
                  SVG
                </a>
                <a href="/assets/viteval.png" download>
                  PNG
                </a>
                <a href="/favicon.ico" download>
                  ICO
                </a>
              </div>
            </article>
            <article className="vv-brand__asset">
              <div className="vv-brand__preview vv-brand__preview--dark vv-brand__motion">
                <img
                  src={
                    isPlaying
                      ? '/assets/viteval-loading.svg'
                      : '/assets/viteval-flask.svg'
                  }
                  alt={
                    isPlaying
                      ? 'Loading flask with gently pulsing cyan bubbles'
                      : 'Still flask'
                  }
                  width="96"
                  height="96"
                />
                <button
                  type="button"
                  onClick={() => setIsPlaying((current) => !current)}
                >
                  {isPlaying ? 'Pause preview' : 'Play preview'}
                </button>
              </div>
              <div className="vv-brand__asset-label">
                <h3>Loading icon</h3>
                <a href="/assets/viteval-loading.svg" download>
                  Download animated SVG
                </a>
              </div>
            </article>
          </div>
          <p className="vv-brand__note">
            The loading icon keeps the outline and liquid stationary. Its
            bubbles gently pulse and remain static under reduced motion. Pair it
            with an accessible loading status in your interface.
          </p>
        </section>

        <section id="loader" aria-labelledby="brand-loader">
          <h2 id="brand-loader">The loader</h2>
          <p>
            The full wordmark used while the docs load. Four bubbles pulse as a
            shine moves left to right across the lettering.
          </p>
          <article className="vv-brand__asset">
            <div className="vv-brand__preview vv-brand__preview--dark vv-brand__motion">
              <img
                src={
                  isLoaderPlaying
                    ? '/assets/viteval-loading-wordmark.svg'
                    : '/assets/viteval-wordmark.svg'
                }
                alt="Viteval full-wordmark loader preview"
                width="320"
                height="109"
              />
              <button
                type="button"
                onClick={() => setIsLoaderPlaying((current) => !current)}
              >
                {isLoaderPlaying
                  ? 'Pause loader preview'
                  : 'Play loader preview'}
              </button>
            </div>
            <div className="vv-brand__asset-label">
              <h3>Loading wordmark</h3>
              <a href="/assets/viteval-loading-wordmark.svg" download>
                Download animated SVG
              </a>
            </div>
          </article>
          <p className="vv-brand__note">
            Reduced motion keeps the logo static. Keep loading status text
            screen-reader-only rather than adding a second visible label.
          </p>
        </section>

        <section id="colors" aria-labelledby="brand-colors">
          <h2 id="brand-colors">Colors</h2>
          <div className="vv-brand__colors">
            {COLORS.map(({ name, hex }) => (
              <article key={name}>
                <div
                  className="vv-brand__swatch"
                  style={{ backgroundColor: hex }}
                />
                <h3>{name}</h3>
                <code>{hex}</code>
              </article>
            ))}
          </div>
          <p className="vv-brand__note">
            Green, amber, and red communicate results; they are not brand
            accents.
          </p>
        </section>

        <section id="typography" aria-labelledby="brand-typography">
          <h2 id="brand-typography">Typography & usage</h2>
          <p>
            The wordmark uses outlined Avenir Next Heavy lettering. The site
            uses Geist for headings and body copy, and Geist Mono for code. The
            logo files do not depend on any of those fonts being installed.
          </p>

          <article className="vv-brand__type-family">
            <h3>Avenir Next Heavy / Wordmark only</h3>
            <div className="vv-brand__preview vv-brand__preview--dark">
              <img
                src="/assets/viteval-wordmark.svg"
                alt="Outlined Avenir Next Heavy Viteval wordmark"
                width="556"
                height="189"
              />
            </div>
            <p className="vv-brand__note">
              Outlined artwork, not a web font. Use the SVG; do not use Avenir
              for interface headings or body copy.
            </p>
          </article>

          <article className="vv-brand__type-family">
            <h3>Geist / Headings</h3>
            <p className="vv-brand__note">
              Desktop sizes shown below. Larger headings scale down on narrow
              screens. These are visual specimens, not additional page headings.
            </p>
            <dl className="vv-brand__type-scale">
              {HEADING_SAMPLES.map(({ level, label, text }) => (
                <div key={level}>
                  <dt>{label}</dt>
                  <dd className={`vv-brand__type-${level}`}>{text}</dd>
                </div>
              ))}
            </dl>
          </article>

          <article className="vv-brand__type-family vv-brand__body-samples">
            <h3>Geist / Body / 16px</h3>
            <p>
              Regular / Keep evaluations beside your application code. Run real
              inputs, compare answers, and inspect what changed.
            </p>
            <p>
              <strong>Bold / Make the important result easy to find.</strong>
            </p>
            <p>
              <em>Italic / Add emphasis without another heading.</em>
            </p>
            <p>
              <strong>
                <em>Bold italic / A stronger point of emphasis.</em>
              </strong>
            </p>
            <p>
              <a href="#logos">Link / Download the approved artwork</a> and keep
              the surrounding text regular.
            </p>
          </article>

          <article className="vv-brand__type-family">
            <h3>Geist Mono / Code & labels</h3>
            <pre>
              <code>{`const threshold = 0.8;\nconst passed = score >= threshold;`}</code>
            </pre>
            <p className="vv-brand__mono-sample">
              Regular / <code>score: 0.98</code>
              <br />
              <strong>Bold / passed: true</strong>
              <br />
              <em>Italic / evaluation complete</em>
              <br />
              <strong>
                <em>Bold italic / review required</em>
              </strong>
            </p>
          </article>

          <h3>Logo usage</h3>
          <p>
            Preserve the proportions, tight spacing, full liquid, and four
            bubbles. Do not stretch, recolor, add frames, or replace the
            lettering with a font. Use the light variant on light surfaces.
          </p>
        </section>
      </main>
    </PageRail>
  );
}
