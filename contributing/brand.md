# Brand reference

## Source of truth

Concept **#13** from the identity review is the approved production logo:
lowercase Avenir Next Heavy, a leading blue flask, completely full deep navy
liquid, and four cyan bubbles. Use the integrated SVGs below, not review artwork.

The [original brand guide](./viteval-approved-brand-guide.pdf),
[original PNG](../public/assets/viteval-flask-reference.png), and draft SVGs are
historical references. Keep them unchanged; they predate this decision.

The other concepts remain in [the scratchpad](../docs/visuals/brand-scratchpad.tsx)
and [comparison artwork](../public/assets/viteval-logo-explorations.svg). The
scratchpad is not linked or rendered on the public site. Review numbers are
preserved there; #13 is the full-bottle lowercase concept, not the later charcoal
color study.

## Identity

- Lowercase outlined wordmark: vit off-white, eval blue.
- Standalone round flask before the lettering; no brackets or background tile.
- Short neck, blue outline, completely full navy liquid, four cyan bubbles.
- No liquid wave, gradients, extra bubbles, or ornamental effects.
- Flask-only app icon and favicon.

Viteval is an independent community project, not affiliated with, endorsed by,
or supported by VoidZero. Do not present it as an official VoidZero project or
use VoidZero product logos as Viteval branding. The blue EVAL emphasizes
evaluation rather than treating VITE as a separate brand prefix.

| Token      | Color     |
| ---------- | --------- |
| Background | `#0B1016` |
| Blue       | `#168DFA` |
| Liquid     | `#032D54` |
| Cyan       | `#12D9E9` |
| Off-white  | `#F8FAFC` |

The integrated SVGs use flat colors. Preserve the flask silhouette, full liquid,
and four bubble positions when exporting other formats.

## Typography and spacing

Use bold, wide, geometric sans-serif headings, restrained sans-serif body copy,
and monospace for code. The wordmark is artwork, not replaceable font text.
Keep lockup gaps tight, surrounding margins generous, and dark surfaces simple.
The flask must not overpower the lettering. The lockup retains the review's
smaller bottle and tighter gap, with visible shapes centered vertically.
The approved bottle uses the review's browser-measured sizing, not the tighter
font-outline bounds: the icon viewport is 102.302 units high against 52.224 units
of visible lettering. Preserve this ratio when exporting the lockup.

The site uses the blue/cyan palette, dark background, and sans-serif headings.
Light mode uses dark vit lettering for contrast; eval, the flask, liquid, and
bubbles remain unchanged. Code and terminal output remain monospace. Green,
amber, and red remain semantic result colors, not brand accents.

## SVG review

- Use outlined lettering and clean vector paths, not an automatic raster trace.
- No embedded bitmaps or font dependencies in pure SVG deliverables.
- The lettering is outlined from Avenir Next Heavy; no font file is distributed.
- Review the dark and light SVGs on their intended backgrounds.
- Inspect flask-only icons at 16, 24, and 32 pixels.
- Keep the flask silhouette legible at small sizes; bubbles may be subpixel at
  favicon scale. Do not enlarge or add bubbles just for small exports.

Integrated assets:

- [Dark wordmark](../public/assets/viteval-wordmark.svg).
- [Light wordmark](../public/assets/viteval-wordmark-light.svg).
- [Flask icon and favicon](../public/assets/viteval-flask.svg).
- [Animated loading flask](../public/assets/viteval-loading.svg): four gently
  pulsing bubbles, static under reduced motion. Use as
  an image with meaningful loading text or an accessible status label in the host
  UI. The outline, liquid, and bubble positions remain stationary.

The docs loader uses `public/assets/viteval-loading-wordmark.svg`, derived from
the approved SVG. Keep it in sync when the approved wordmark changes.
Four bubbles pulse while a shine crosses the outlined
lettering on a navy backdrop. Reduced motion keeps the mark static. The loading
label is disabled in the loader config. Do not add a second visible text label.

PNG and ICO exports in `public/` and `packages/ui/public/` use the same flask.
The dashboard's wordmark PNG is exported from the dark wordmark SVG. Regenerate
these exports when changing the approved SVGs; do not edit the rasters separately.

Original review drafts:

- [Wordmark](../public/assets/viteval-flask-wordmark-draft.svg).
- [Flask-only icon](../public/assets/viteval-flask-icon-draft.svg).

No fonts, embedded images, automatic tracing, or filters in the integrated SVGs.
The light variant changes only the neutral lettering color.
