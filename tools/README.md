# tools/

Local helpers. None of this ships - `.vercelignore` keeps the whole directory
out of the deployment.

| script | what it does |
|---|---|
| `serve.py` | Local preview with Vercel's `cleanUrls` behaviour. Warns if minified assets are stale. |
| `minify.py` | Regenerates `css/style.min.css` and `js/script.min.js` (esbuild via npx). `--check` exits 1 when stale. |
| `images.py` | Converts source images to WebP, quality-gated by SSIM. Never resizes. |
| `responsive.py` | Builds the `srcset` ladder and writes `srcset`/`sizes` into the pages. |
| `measure.js` | Drives headless Chromium over the preview and records each image's real rendered width. |

## Re-measuring image sizes

`responsive.py` holds a `MEASURED` table of how wide each image class actually
renders. Deriving those numbers from CSS `max-width` gives wrong answers -
containers nest and grids subdivide, so an element inside a 1152px container may
only ever paint 502px. Re-measure whenever layout changes:

```
python tools/serve.py --port 8931 --no-open      # terminal 1
npm install playwright && npx playwright install chromium
node tools/measure.js                            # terminal 2 -> measured.json
```

Then update `MEASURED` in `responsive.py` and re-run it.

## Order after editing images or styles

```
python tools/images.py        # source -> webp
python tools/responsive.py    # webp -> srcset ladder + page rewrite
python tools/minify.py        # css/js
```
