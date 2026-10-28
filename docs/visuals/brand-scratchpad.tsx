import { PageRail } from '@ciderpress/ui/theme';
import { useEffect, useRef, useState } from 'react';

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

const LOGO_LETTERING = [
  { id: 'current', label: 'A / Current custom lettering' },
] as const;

const TILE_COLORS = [
  { name: 'Blue', fill: '#168DFA' },
  { name: 'Deep blue', fill: '#075AA3' },
] as const;

const FLASK_COLOR_STUDIES = [
  {
    number: 29,
    name: 'White flask / navy liquid',
    outline: '#F8FAFC',
    wave: '#12D9E9',
    liquid: '#0B1016',
  },
  {
    number: 30,
    name: 'Pale blue flask / white liquid',
    outline: '#A4D4FE',
    wave: '#12D9E9',
    liquid: '#F8FAFC',
  },
] as const;

const LIQUID_STUDIES = [
  { number: 31, name: 'Low fill', level: 494, bubbles: false },
  { number: 32, name: 'High fill', level: 444, bubbles: false },
  { number: 33, name: 'Medium fill + bubbles', level: 468, bubbles: true },
  { number: 34, name: 'High fill + bubbles', level: 444, bubbles: true },
  {
    number: 35,
    name: 'Completely full + bubbles',
    level: 420,
    bubbles: true,
    full: true,
  },
] as const;

const LIQUID_COLOR_STUDIES = [
  { name: 'Cobalt', liquid: '#123D91' },
  { name: 'Indigo', liquid: '#30215E' },
  { name: 'Deep teal', liquid: '#06434B' },
  { name: 'Blue charcoal', liquid: '#111C28' },
] as const;

const ICON_BACKGROUNDS = [
  ...TILE_COLORS.flatMap(({ name, fill }, index) => [
    {
      id: `tile-${index}-rounded`,
      label: `${17 + index * 2} / ${name} — rounded`,
      fill,
      radius: 20,
      palette: { outline: '#F8FAFC', wave: '#12D9E9', liquid: '#0BB5F0' },
    },
    {
      id: `tile-${index}-flat`,
      label: `${18 + index * 2} / ${name} — square`,
      fill,
      radius: 0,
      palette: { outline: '#F8FAFC', wave: '#12D9E9', liquid: '#0BB5F0' },
    },
  ]),
  ...FLASK_COLOR_STUDIES.map((palette) => ({
    id: `tile-flask-color-${palette.number}`,
    label: `${palette.number} / Blue background — ${palette.name}`,
    fill: '#168DFA',
    radius: 20,
    palette,
  })),
  ...LIQUID_STUDIES.map((study) => ({
    id: `tile-liquid-${study.number}`,
    label: `${study.number} / #29 variation — ${study.name}`,
    fill: '#168DFA',
    radius: 20,
    palette: FLASK_COLOR_STUDIES[0],
  })),
  {
    id: 'tile-original-lower',
    label: '36 / Lowercase — original liquid',
    fill: '#168DFA',
    radius: 20,
    palette: { outline: '#168DFA', wave: '#12D9E9', liquid: '#032D54' },
  },
  ...LIQUID_STUDIES.map((study, index) => ({
    id: `tile-liquid-${study.number}-lower`,
    label: `${37 + index} / Lowercase — ${study.name}`,
    fill: '#168DFA',
    radius: 20,
    palette: { outline: '#168DFA', wave: '#12D9E9', liquid: '#032D54' },
  })),
  ...LIQUID_COLOR_STUDIES.flatMap(({ name, liquid }, index) =>
    [34, 35].map((studyNumber, fillIndex) => ({
      id: `tile-liquid-${studyNumber}-color-${index}-lower`,
      label: `${42 + index * 2 + fillIndex} / ${name} — ${studyNumber === 34 ? 'almost full' : 'completely full'} + bubbles`,
      fill: '#168DFA',
      radius: 20,
      palette: { outline: '#168DFA', wave: '#12D9E9', liquid },
    }))
  ),
  ...[20, 0].map((radius, index) => ({
    id: `tile-liquid-35-charcoal-${radius}-lower`,
    label: `${50 + index} / Lowercase — ${radius === 20 ? 'rounded' : 'square'} blue tile / charcoal bubbles`,
    fill: '#168DFA',
    radius,
    framed: true,
    palette: { outline: '#F8FAFC', wave: '#12D9E9', liquid: '#111C28' },
  })),
];

const LOGO_BRACKETS = [
  { id: 'parens', label: '1 / Parentheses' },
  { id: 'square', label: '2 / Square brackets' },
  { id: 'braces', label: '3 / Braces — preferred concept' },
  { id: 'none', label: '4 / Flask first — no brackets' },
  { id: 'front-braces', label: '5 / Flask first — braces' },
  { id: 'front-large', label: '6 / Flask first — 10% larger, no brackets' },
  {
    id: 'front-large-lower',
    label: '7 / Flask first — 10% larger, lowercase',
  },
  ...ICON_BACKGROUNDS,
] as const;

const SHORTLISTED_CONCEPTS = [
  7, 29, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 48, 49, 50, 51,
] as const;

/**
 * Archived identity explorations; concept #13 became the production logo.
 * @returns The preserved brand scratchpad, not linked from the public site.
 * @example
 * <BrandScratchpad />
 */
export function BrandScratchpad() {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <PageRail>
      <main className="vv-brand">
        <header className="vv-brand__intro">
          <p className="vv-eyebrow">Viteval / Brand & assets</p>
          <h1>Brand assets</h1>
          <p>
            Download Viteval logos and icons for documentation, integrations,
            and projects.
          </p>
          <p>
            Viteval is an independent community project, not affiliated with,
            endorsed by, or supported by VoidZero. It is not an official
            VoidZero project.
          </p>
          <nav aria-label="Brand sections">
            <a href="#explorations">Logo explorations</a>
            <a href="#logos">Logos</a>
            <a href="#icons">Icons & motion</a>
            <a href="#colors">Colors</a>
            <a href="#typography">Typography</a>
          </nav>
        </header>

        <section id="explorations" aria-labelledby="brand-explorations">
          <h2 id="brand-explorations">Logo explorations</h2>
          <p>
            Uppercase and lowercase liquid studies. Every option keeps the flask
            and blue EVAL; the live logo is unchanged.
          </p>
          <p>
            #1 is the Avenir lowercase logo. #2 is the original white flask with
            navy liquid on a blue tile (previously #29). These remain previews,
            not approved assets.
          </p>
          <p>
            #3–7 vary the liquid level and bubbles in #2. #7 is completely full,
            with bubbles and no wave line. Bubbles are exploratory here, not a
            change to the approved brand assets.
          </p>
          <p>
            #8–13 pair standalone bottles with blue outlines and deep navy
            liquid, without backgrounds, with #1’s lowercase Avenir lettering:
            original, low fill, high fill, medium with bubbles, high with
            bubbles, and completely full with bubbles.
          </p>
          <p>
            #1–14 remain for comparison. Other bright color studies are hidden;
            #20–21 use near-black blue charcoal liquid (#111C28). #22–23 pair
            the lowercase wordmark with rounded and square blue tiles, a white
            bottle outline, and completely full charcoal liquid with bubbles.
          </p>
          <p className="vv-brand__note">
            Other concepts remain in the source but are hidden from this review.
            #1 uses Avenir Next Heavy, a system font that may fall back outside
            macOS.
          </p>
          <div className="vv-brand__explorations">
            {LOGO_LETTERING.flatMap((lettering) =>
              LOGO_BRACKETS.filter((brackets) =>
                SHORTLISTED_CONCEPTS.some(
                  (number) => number === Number(brackets.label.split(' / ')[0])
                )
              ).map((brackets) => (
                <article
                  className="vv-brand__asset"
                  key={`${lettering.id}-${brackets.id}`}
                  id={`concept-${getReviewNumber(brackets.label)}`}
                >
                  <div className="vv-brand__preview vv-brand__preview--dark vv-brand__concept">
                    <span className="vv-brand__concept-number">
                      #{getReviewNumber(brackets.label)}
                    </span>
                    <LogoConcept
                      lettering={lettering}
                      brackets={brackets}
                      label={`Concept ${getReviewNumber(brackets.label)}`}
                    />
                  </div>
                  <div className="vv-brand__asset-label">
                    <h3>
                      {brackets.id.endsWith('-lower')
                        ? 'Avenir Next Heavy / lowercase study'
                        : brackets.id.startsWith('tile-')
                          ? 'Uppercase bold / reference proportions'
                          : brackets.id === 'front-large-lower'
                            ? 'Avenir Next Heavy / lowercase study'
                            : lettering.label}
                      <br />
                      {getReviewNumber(brackets.label)} /{' '}
                      {brackets.label
                        .split(' / ')[1]
                        ?.replace('#29 variation — ', '')}
                    </h3>
                  </div>
                </article>
              ))
            )}
          </div>
          <p className="vv-brand__note">
            Updated review: tighter spacing and optical centering based on the
            visible letter shapes.
          </p>
        </section>

        <section id="logos" aria-labelledby="brand-logos">
          <h2 id="brand-logos">The wordmark</h2>
          <p>
            Custom lettering with VIT in a neutral color and EVAL in blue, a
            round flask, and tight parentheses. Use the complete lockup; don’t
            recreate it with a font.
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

function LogoConcept({
  lettering,
  brackets,
  label,
}: {
  lettering: (typeof LOGO_LETTERING)[number];
  brackets: (typeof LOGO_BRACKETS)[number];
  label: string;
}) {
  const wordRef = useRef<SVGTextElement>(null);
  const liquidStudy = LIQUID_STUDIES.find(
    (study) =>
      brackets.id === `tile-liquid-${study.number}` ||
      brackets.id.startsWith(`tile-liquid-${study.number}-`)
  );
  const liquidClipId = `liquid-${brackets.id}`;
  const [bounds, setBounds] = useState({
    x: 0,
    y: 0,
    width: 284.27,
    height: 45.88,
  });
  const iconBackground = ICON_BACKGROUNDS.find(
    (concept) => concept.id === brackets.id
  );
  const isLowercase = brackets.id.endsWith('-lower');
  const isFontStudy = isLowercase;
  const hasFrame =
    iconBackground !== undefined &&
    (!isLowercase ||
      ('framed' in iconBackground && iconBackground.framed === true));
  const fontFamily = 'Avenir Next, Avenir, sans-serif';
  const fontWeight = 900;
  const isFlaskFirst =
    brackets.id === 'none' ||
    brackets.id.startsWith('front-') ||
    isFontStudy ||
    iconBackground !== undefined;
  const hasWrapper = !isFlaskFirst || brackets.id === 'front-braces';
  const iconScale = brackets.id.startsWith('front-large') ? 1.1 : 1;
  const usesReferenceRatio = iconBackground !== undefined;
  const iconHeight =
    (usesReferenceRatio ? bounds.height * 1.3 : 70 * iconScale) *
    (isLowercase ? 0.9 : 1);
  const iconWidth = usesReferenceRatio
    ? iconHeight * (hasFrame ? 1 : 62 / 80)
    : (hasWrapper ? 101.5 : 58) * iconScale;
  const gap = isLowercase
    ? bounds.height * 0.1
    : usesReferenceRatio
      ? bounds.height * 0.25
      : 8;
  const centerY = bounds.y + bounds.height / 2;
  const height = Math.max(bounds.height, iconHeight);
  const wordOffset = isFlaskFirst ? iconWidth + gap : 0;

  useEffect(() => {
    if (!isFontStudy) {
      return;
    }

    let isActive = true;
    void document.fonts.ready.then(() => {
      if (!isActive || !wordRef.current) {
        return;
      }
      const { x, y, width, height } = wordRef.current.getBBox();
      setBounds({ x, y, width, height });
    });

    return () => {
      isActive = false;
    };
  }, [isFontStudy, fontFamily]);

  return (
    <svg
      viewBox={`${bounds.x - 2} ${centerY - height / 2 - 2} ${bounds.width + gap + iconWidth + 4} ${height + 4}`}
      role="img"
      aria-label={`Viteval: ${isLowercase ? 'lowercase lettering' : lettering.label}, ${label}`}
    >
      <g transform={`translate(${wordOffset} 0)`}>
        {isFontStudy ? (
          <text
            ref={wordRef}
            fontFamily={fontFamily}
            fontSize="64"
            fontWeight={fontWeight}
            letterSpacing="-1"
            fill="#F8FAFC"
          >
            {isLowercase ? 'vit' : 'VIT'}
            <tspan fill="#168DFA">{isLowercase ? 'eval' : 'EVAL'}</tspan>
          </text>
        ) : (
          <use href="/assets/viteval-logo-explorations.svg#current" />
        )}
      </g>
      <svg
        x={isFlaskFirst ? bounds.x : bounds.x + bounds.width + gap}
        y={centerY - iconHeight / 2}
        width={iconWidth}
        height={iconHeight}
        viewBox={
          hasFrame
            ? '309 -23 104 104'
            : hasWrapper
              ? '303 -11 116 80'
              : '331 -11 62 80'
        }
      >
        {iconBackground && hasFrame && (
          <rect
            x="314"
            y="-18"
            width="94"
            height="94"
            rx={iconBackground.radius}
            fill={iconBackground.fill}
          />
        )}
        <g
          transform={
            hasFrame
              ? 'translate(361 29) scale(.87) translate(-361 -29)'
              : undefined
          }
        >
          {iconBackground ? (
            <g transform="translate(322 -10) scale(.36) translate(-1190 -340)">
              <path
                fill={iconBackground.palette.outline}
                fillRule="evenodd"
                d="M1274 348h48c7 0 12 6 12 13s-5 12-10 12v26c31 12 51 39 51 72 0 43-35 77-77 77s-77-34-77-77c0-33 20-60 50-72v-26c-5 0-9-5-9-12s5-13 12-13Zm13 25v32c0 5-2 7-7 9-26 8-43 31-43 57 0 34 27 61 61 61s61-27 61-61c0-26-17-49-43-57-5-2-7-4-7-9v-32Z"
              />
              {liquidStudy && 'full' in liquidStudy && liquidStudy.full ? (
                <>
                  <path
                    fill={iconBackground.palette.liquid}
                    d="M1287 373v32c0 5-2 7-7 9-26 8-43 31-43 57 0 34 27 61 61 61s61-27 61-61c0-26-17-49-43-57-5-2-7-4-7-9v-32Z"
                  />
                  <g fill={iconBackground.palette.wave}>
                    <circle cx="1274" cy="448" r="5" />
                    <circle cx="1304" cy="486" r="7" />
                    <circle cx="1324" cy="461" r="3.5" />
                    <circle cx="1280" cy="512" r="3" />
                  </g>
                </>
              ) : liquidStudy ? (
                <>
                  <defs>
                    <clipPath id={liquidClipId}>
                      <circle cx="1298" cy="471" r="60" />
                    </clipPath>
                  </defs>
                  <g clipPath={`url(#${liquidClipId})`}>
                    <path
                      fill={iconBackground.palette.wave}
                      d={createLiquidWavePath(liquidStudy.level)}
                    />
                    <path
                      fill={iconBackground.palette.liquid}
                      d={createLiquidWavePath(liquidStudy.level + 8)}
                    />
                    {liquidStudy.bubbles && (
                      <g fill={iconBackground.palette.wave}>
                        <circle cx="1274" cy={liquidStudy.level + 20} r="5" />
                        <circle cx="1304" cy={liquidStudy.level + 34} r="7" />
                        <circle cx="1324" cy={liquidStudy.level + 15} r="3.5" />
                      </g>
                    )}
                  </g>
                </>
              ) : (
                <>
                  <path
                    fill={iconBackground.palette.wave}
                    d="M1238 458c18-11 29-13 43-6 20 10 27 18 46 13 18-5 21-12 29-9 2 5 3 10 3 15 0 34-27 61-61 61s-61-27-61-61c0-5 0-9 1-13Z"
                  />
                  <path
                    fill={iconBackground.palette.liquid}
                    d="M1240 488c20-4 45-1 65-21 15-2 33 3 52-7 1 4 2 7 2 11 0 34-27 61-61 61-28 0-51-18-58-44Z"
                  />
                </>
              )}
            </g>
          ) : (
            <use href="/assets/viteval-logo-explorations.svg#flask" />
          )}
        </g>
        {hasWrapper && (
          <use
            href={`/assets/viteval-logo-explorations.svg#${isFlaskFirst ? 'braces' : brackets.id}`}
          />
        )}
      </svg>
    </svg>
  );
}

function createLiquidWavePath(level: number) {
  return `M1237 ${level} C1257 ${level - 10} 1278 ${level + 10} 1298 ${level} S1339 ${level - 10} 1359 ${level} V540H1237Z`;
}

function getReviewNumber(label: string) {
  const sourceNumber = Number(label.split(' / ')[0]);
  if (sourceNumber === 7) {
    return 1;
  }
  if (sourceNumber === 29) {
    return 2;
  }
  return sourceNumber - 28;
}
