# Brand reference

## Source of truth

- [Approved brand guide](./viteval-approved-brand-guide.pdf).
- [Approved PNG](../public/assets/viteval-flask-reference.png).

The flask identity replaces the earlier check-and-sparkles direction. Keep the
approved reference files unchanged. The site uses manually reconstructed SVGs;
the original draft files remain available for comparison. These are clean vector
interpretations, not pixel-identical reproductions of the PNG's raster texture.

## Identity

- Uppercase custom wordmark: VITE off-white, VAL blue.
- Round flask in tight parentheses after the wordmark.
- Short neck, spherical outline, visible cyan liquid wave.
- Flask-only app icon; do not include parentheses in the favicon.
- No floating bubbles, aggressive gradients, or ornamental effects.

| Token      | Color     |
| ---------- | --------- |
| Background | `#0B1016` |
| Blue       | `#168DFA` |
| Cyan       | `#12D9E9` |
| Off-white  | `#F8FAFC` |

The PNG contains raster shading and texture; its sampled pixels are not identical
to the guide's flat palette. Preserve the approved silhouette and liquid wave in
logo reconstruction. Use the guide's tokens for subsequent interface branding.

## Typography and spacing

Use bold, wide, geometric sans-serif headings, restrained sans-serif body copy,
and monospace for code. The wordmark is artwork, not replaceable font text.
Keep lockup gaps tight, surrounding margins generous, and dark surfaces simple.
The flask must not overpower the text or parentheses.

The site uses the blue/cyan palette, dark background, and sans-serif headings.
Light mode uses dark lettering and parentheses for contrast; the blue flask and
cyan wave remain unchanged. Code and terminal output remain monospace. Green,
amber, and red remain semantic result colors, not brand accents.

## SVG review

- Construct clean Bézier paths manually, not an automatic raster trace.
- No embedded bitmaps or font dependencies in pure SVG deliverables.
- Compare against the PNG at identical sizes; do not claim pixel-perfect parity
  without checking the rendered output.
- Inspect flask-only icons at 16, 24, and 32 pixels.
- Retain the cyan wave and clear neck opening at small sizes.

Integrated assets:

- [Dark wordmark](../public/assets/viteval-wordmark.svg).
- [Light wordmark](../public/assets/viteval-wordmark-light.svg).
- [Flask icon and favicon](../public/assets/viteval-flask.svg).
- [Animated loading flask](../public/assets/viteval-loading.svg): two clipped
  liquid layers, gentle continuous motion, static under reduced motion. Use as
  an image with meaningful loading text or an accessible status label in the host
  UI. No floating bubbles; the outline remains stationary.

Original review drafts:

- [Wordmark](../public/assets/viteval-flask-wordmark-draft.svg).
- [Flask-only icon](../public/assets/viteval-flask-icon-draft.svg).

The integrated SVGs use flat guide colors and a secondary liquid fill to preserve
the reference's wave. No fonts, embedded images, automatic tracing, or filters.
The light variant is an accessibility adaptation, not artwork supplied by the guide.
