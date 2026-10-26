import { PageRail } from '@ciderpress/ui/theme';
import { useState } from 'react';

import './hero-background.css';
import './brand-page.css';

const COLORS = [
  { name: 'Background', hex: '#0B1016' },
  { name: 'Blue', hex: '#168DFA' },
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

/**
 * Interactive brand reference with downloadable artwork and motion previews.
 * @returns The public brand page.
 * @example
 * <BrandPage />
 */
export function BrandPage() {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <PageRail>
      <main className="vv-brand">
        <header className="vv-brand__intro">
          <p className="vv-eyebrow">Viteval / Brand & assets</p>
          <h1>
            A small flask.
            <br />A clear identity.
          </h1>
          <p>
            Logos, icons, motion, and the visual foundations behind Viteval.
            Download the artwork for your documentation, integrations, and
            projects.
          </p>
          <nav aria-label="Brand sections">
            <a href="#logos">Logos</a>
            <a href="#icons">Icons & motion</a>
            <a href="#colors">Colors</a>
            <a href="#typography">Typography</a>
          </nav>
        </header>

        <section id="logos" aria-labelledby="brand-logos">
          <h2 id="brand-logos">The wordmark</h2>
          <p>
            Custom lettering, a round flask, and tight parentheses. Use the
            complete lockup; don’t recreate it with a font.
          </p>
          <div className="vv-brand__grid">
            {WORDMARKS.map(({ name, tone, filename }) => (
              <article className="vv-brand__asset" key={filename}>
                <div className={`vv-brand__preview vv-brand__preview--${tone}`}>
                  <img
                    src={`/assets/${filename}`}
                    alt={`Viteval wordmark for ${name.toLowerCase()}`}
                    width="1192"
                    height="216"
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
            Transparent backgrounds. Vector paths, no fonts or embedded images.
            Preserve the proportions and leave generous clear space.
          </p>
        </section>

        <section id="icons" aria-labelledby="brand-icons">
          <h2 id="brand-icons">The flask, in motion</h2>
          <p>
            The standalone icon for app icons, favicons, and loading states. A
            stationary outline with two gently moving liquid layers. No floating
            bubbles.
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
                      ? 'Loading flask with gently moving cyan liquid'
                      : 'Still flask'
                  }
                  width="96"
                  height="96"
                />
                <button
                  type="button"
                  aria-pressed={isPlaying}
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
            The loading SVG loops on its own and respects reduced motion. When
            using it in an interface, pair it with an accessible loading status.
            The preview above is artwork, not a page loading state.
          </p>
        </section>

        <section id="colors" aria-labelledby="brand-colors">
          <h2 id="brand-colors">Four foundations</h2>
          <p>
            Blue for the identity. Cyan for the liquid and supporting accents.
            Dark, simple surfaces with off-white text.
          </p>
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
            Use darker blue and cyan for text on light surfaces. Green, amber,
            and red communicate results; they aren’t additional brand accents.
          </p>
        </section>

        <section id="typography" aria-labelledby="brand-typography">
          <h2 id="brand-typography">Type that gets out of the way</h2>
          <p>
            Bold sans-serif headings, restrained body copy, monospace for code.
            The site uses Geist and Geist Mono; the logo remains custom artwork.
          </p>
          <div className="vv-brand__type-sample">
            <span>Geist / Heading</span>
            <p className="vv-brand__display">
              Measure what
              <br />
              your agent does.
            </p>
          </div>
          <div className="vv-brand__type-sample">
            <span>Geist / Body</span>
            <p>
              Keep evaluations beside your application code. Run real inputs,
              compare answers, and inspect what changed.
            </p>
          </div>
          <div className="vv-brand__type-sample">
            <span>Geist Mono / Code</span>
            <pre>
              <code>pnpm exec viteval run</code>
            </pre>
          </div>
        </section>

        <section aria-labelledby="brand-usage">
          <h2 id="brand-usage">Keep it recognizable</h2>
          <p>
            Keep the liquid wave visible, the neck short, and the outline round.
            Don’t stretch, recolor, add bubbles, or turn the wordmark into text.
            Use the light variant only on light surfaces.
          </p>
          <p className="vv-brand__note">
            These SVGs are manually reconstructed from the supplied artwork
            using the brand guide’s flat palette. The original raster texture is
            not part of the vector assets.
          </p>
        </section>
      </main>
    </PageRail>
  );
}
