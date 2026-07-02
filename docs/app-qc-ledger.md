# PREPARE MENA — QC Ledger

## PREPARE MENA actionable intelligence upgrade

- [x] Rename product and add About workspace
- [x] Move full capacity blind-spots analysis to Regional Overview
- [x] Reorder and simplify Context & Pressures
- [x] Add transparent regional action agenda
- [x] Replace synthetic CSV downloads with real download links and a clipboard fallback
- [x] Add workspace-specific print briefing structure
- [x] Update occupied Palestinian territory naming and caveats
- [x] Expand methodology and action-template governance
- [x] Run calculation, browser, accessibility, responsive, and PDF QC

## Regional Preparedness Intelligence enhancement

- [x] Remove ISR from the canonical snapshots, geographic boundaries, selectors, calculations, exports, and legacy embedded runtime.
- [x] Validate a 21-country denominator and recalculate medians, ranks, peer groups, capacity distributions, regressions, and displacement totals.
- [x] Rename the first workspace Regional Overview; canonicalize `view=overview` and preserve `view=situation` as an alias.
- [x] Add selectable health-system foundations with URL restoration and nine indicators.
- [x] Replace the ECharts radar with a keyboard-focusable SVG profile and style-faithful legend.
- [x] Restore actual-unit health-context bullet rows with a regional-median marker.
- [x] Add income, conflict-status, and all-region peer modes with fallback and URL state.
- [x] Expand Methodology & Data Quality with scope, calculations, indicator dictionary, source registry, quality matrix, limitations, and downloads.
- [x] Add panel-level CSV controls, lazy workspace loading, RTL-safe rules, reduced-motion behavior, and print styles.
- [x] Test overview, context, country, and methodology workspaces at desktop, tablet, and mobile widths.

## Material findings fixed

1. Coverage badges retained a hard-coded 22-country denominator after scope migration. The default denominator is now 21.
2. Tablet filters caused document-level horizontal overflow. The filter rail now scrolls internally below 1,100 px.
3. The World Bank endpoint rejected some long multi-country requests with HTTP 400. Refresh now uses seven-country batches and a per-country fallback while retaining fail-closed publication.
4. The former radar legend encoded only color and point inspection did not expose all comparators. The SVG profile uses solid/dashed/dotted strokes in chart and legend and exposes all three values, years, and coverage from every point.
5. Health-system comparisons indexed every median to 100. Each row now uses original units, a country bar, a median marker, explicit scale, years, coverage, and direction note.
6. Legacy workspace and selector state was incomplete. View, country, filters, and peer mode now round-trip through the URL; old `foundation` parameters are safely discarded from newly generated URLs.
7. CSV buttons previously depended on programmatic Blob clicks. Exports now use real UTF-8 BOM data links with stable filenames, plus a copy fallback for embedded browsers that suppress download events.
9. The fifth mobile navigation item could overflow because its long label imposed an intrinsic minimum width. Mobile navigation now allocates an explicit equal-width fifth to every workspace.
10. Two-column print charts retained screen canvas dimensions and clipped axes. Context and Country briefing charts now use full-width print rows; CSS page-margin boxes provide correct `Page x of y` numbering without overlaying content.

## Analytical verification

- Scope: 21/21 countries report a SPAR composite; regional median 76; 7 below 60.
- Conflict-affected: n=8, median 41. Other settings: n=13, median 84.
- Detailed capacity coverage: 20/21 countries; occupied Palestinian territory: 0/14 included domains in the queried WHO detailed-capacity dataset.
- Reported displaced people present: 29,027,911 (refugees + asylum-seekers + IDPs), UNHCR 2025 snapshot.
- Missing values are excluded rather than represented as zero. Quartiles use linear interpolation and ties use competition ranking.

## Verification evidence

- `npm test -- --run`: 20 tests passed.
- `python3 -m pytest -q`: 5 tests passed.
- `python3 scripts/validate_data.py public/data.json`: validated 21 countries.
- `npm run build`: TypeScript and Vite production build passed with workspace-level lazy chunks.
- In-app browser checks found no console errors or document overflow at 1,440 px and 390 px; a tablet overflow finding at 768 px was fixed and rechecked.
- Headless Chromium render inspection covered all five workspaces at desktop, tablet, and mobile widths, including long Country Profile and occupied Palestinian territory states.
- A4 PDFs were rendered for all five workspaces. Overview produced 3 pages, Context 3 after the print-width correction, Country 6 after the print-width correction, About 2, and Methodology 4; sampled pages were rasterized and visually inspected for hierarchy and clipping.
- Legacy `view=situation` canonicalized to `view=overview`; legacy `foundation` state is tolerated but not emitted.
- Direct occupied Palestinian territory review confirmed explicit unavailable capacity panels, no zero-valued radar, and no generated action candidates.

## Remaining non-material constraint

The shared tree-shaken ECharts module is approximately 614 KB minified / 206 KB gzip and triggers Vite's 500 KB advisory. Workspaces are lazy-loaded, so the initial application and each workspace load independently; replacing ECharts is outside this enhancement and would materially increase visualization regression risk.
