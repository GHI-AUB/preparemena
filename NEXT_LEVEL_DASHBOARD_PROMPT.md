# Implementation Prompt: MENA Epidemic Preparedness Intelligence Platform

You are a multidisciplinary senior team comprising a global health security expert, epidemiologist, health-systems analyst, data engineer, information designer, UX researcher, accessibility specialist, and senior frontend engineer.

Redesign and rebuild the existing **MENA Epidemic-Preparedness Dashboard** as a credible, executive-first policy intelligence product. Work directly from the repository and inspect the existing files, calculations, data coverage, charts, and interactions before proposing or changing anything.

Do not build a generic dashboard or a cosmetic reskin. Preserve the existing analytical value while making the product substantially more useful, defensible, maintainable, accessible, and actionable.

## 1. Product purpose and audience

The product supports strategic epidemic-preparedness planning across 22 Middle East and North Africa countries. It is not a real-time outbreak surveillance system and must never imply that it is.

Design first for:

1. Ministers of health, senior government officials, and regional policy leaders who need an accurate briefing in under 30 seconds.
2. WHO, UN, donor, and development-partner teams deciding where technical assistance or investment may be most needed.
3. National program managers and analysts who need to investigate country gaps, compare peers, understand data limitations, and export evidence.

Organize the experience around three questions:

1. **Where is preparedness weakest?**
2. **Why is it weak?**
3. **What should decision-makers examine or prioritize next?**

Do not convert observational data into prescriptive certainty. Distinguish clearly between measured capacity gaps, contextual associations, and expert interpretation.

## 2. Current product that must be understood and preserved

The current repository contains:

- A self-contained `index.html` with embedded data, map geometry, CSS, and ECharts logic.
- A standalone `app.js` copy of the visualization logic.
- `data.json`, covering 21 countries.
- `mena.geo.json`, containing map geometry.
- `build_data.py`, which retrieves data from WHO GHO, World Bank Open Data, and UNHCR.

Preserve and improve these existing capabilities:

- Regional preparedness summary across all 21 countries.
- Interactive MENA map and country selection.
- Country rankings and regional benchmarks.
- Conflict-affected versus stable-setting comparison.
- Income, health expenditure, health-system, and displacement context.
- Preparedness trajectories over time.
- Fifteen WHO IHR/SPAR capacity domains.
- Country profile with strengths, gaps, context, trajectory, and peer comparison.
- Clear acknowledgement that SPAR is self-assessed.

Do not silently drop an existing indicator, country, analytical view, or caveat. If a view is removed or merged, document why and show where its analytical purpose is preserved.

## 3. Required information architecture

Build five primary product areas.

### A. Regional Overview

This is the default landing view. It must answer the three policy questions without requiring a long scroll through unrelated charts.

Include:

- A concise regional status statement generated from transparent deterministic rules, not unsupported AI claims.
- Headline measures with denominators, reference years, and definitions.
- A MENA map synchronized with a ranked country table or plot.
- A visible priority matrix combining preparedness level and contextual pressure without inventing a scientifically unsupported composite score.
- Regional capacity gaps showing both median and country distribution, not median alone.
- Trend status that separates genuine multi-year trajectories from single-year or incomplete observations.
- A short “What requires attention” panel based on explicit, inspectable thresholds.
- A persistent data-freshness and coverage summary.

### B. Country Diagnostic

For a selected country, provide:

- Current preparedness score, score year, rank with tie handling, regional position, and trend.
- A concise evidence-based interpretation with explicit rules and caveats.
- All 15 capacity values compared with the regional median and a relevant peer group.
- Strongest and weakest relative capacities without treating missing values as zero.
- Health-system and financing context, with each indicator’s own year and source.
- Displacement and conflict context presented carefully and without stigmatizing language.
- Data gaps and comparability warnings displayed near the affected result.
- Direct links into comparison and briefing modes.

Avoid relying on a radar chart as the primary diagnostic. If retained, make it secondary and pair it with a more legible ordered gap view and accessible table.

### C. Country Comparison

Allow users to compare between two and five countries, with at least three supported as an acceptance requirement.

Include:

- Manual country selection and suggested peer groups.
- Peer definitions based on income, geography/subregion, conflict status, or user selection.
- Side-by-side preparedness, capacity, trend, health-system, financing, and displacement comparisons.
- Normalized displays only where units differ, with raw values always available.
- Explicit source year and coverage markers for every value.
- A comparison summary that distinguishes facts from interpretation.
- Shareable URL state and export to a policy-ready briefing.

### D. Capacity and Investment Priorities

Create a regional and country-level diagnostic workspace that helps users identify where further assessment or investment discussion may be warranted.

Include:

- Capacity-by-country heatmap with sorting and filters.
- Distribution, median, range, coverage, and change for each capacity.
- Drill-down from a capacity to affected countries and relevant contextual indicators.
- A transparent prioritization view based on separately displayed dimensions such as low capacity, negative trend, health-system constraint, displacement pressure, and data confidence.
- No opaque composite “priority score” unless a documented, reviewed methodology is supplied.
- Exportable evidence tables for planning discussions.

Use language such as “priority for review,” “reported capacity gap,” and “contextual pressure.” Do not claim that the dashboard determines funding allocations or proves causal drivers.

### E. Methodology and Data Quality Center

Provide a first-class methodology area rather than burying caveats in a footer.

Include:

- Indicator dictionary with definition, unit, direction, source, source URL, and update frequency.
- Country-by-indicator coverage matrix.
- Reference-year distribution and stale-data rules.
- Last attempted refresh and last successful refresh.
- Source-specific refresh status and error history.
- Downloadable processed dataset and metadata.
- Calculation documentation for medians, ranks, ties, trends, peer groups, thresholds, and regression residuals.
- Versioned methodology notes and known limitations.

## 4. Filters and coordinated interaction

Provide a persistent but compact filter system supporting:

- Country and multi-country selection.
- Subregion.
- Income group.
- Conflict-affected status.
- Capacity domain.
- Indicator/reference year where meaningful.
- Data-coverage status.

Filters must update all compatible views, expose the active denominator, and offer a clear reset. Do not apply a filter silently to charts where it is not analytically valid. Preserve selected filters in the URL so a view can be shared and restored.

Clicking or keyboard-selecting a country in the map, ranking, table, scatterplot, heatmap, or trend view must update the shared selection state consistently. Provide visible focus and selected states.

## 5. Analytical and global-health standards

Apply the following rules throughout the product:

- Describe WHO IHR/SPAR scores as **State Party self-assessed capacity signals**, not external audits, verified operational performance, or outbreak readiness guarantees.
- Display the actual reference year beside every value. Do not label mixed-year data as though it came from one common year.
- Treat missing data as missing. Never convert missing capacity values to zero in calculations or charts.
- Palestine currently has limited trend coverage and no detailed capacity values in the supplied dataset. Show an honest unavailable state rather than a zero profile.
- Treat the current fragile/conflict classification as a versioned World Bank FY25 classification, not a permanent country attribute.
- Rename “Spending efficiency” to an analytically defensible term such as **Preparedness relative to reported health spending**.
- Describe regression residuals as exploratory associations. Do not infer efficiency, impact, causality, or return on investment from cross-sectional residuals.
- Show scatterplot sample size, coverage exclusions, axis transformations, and trend-line method.
- Rankings must use documented tie handling and expose missing scores and score years.
- Comparisons must show denominators and avoid implying statistical significance without a valid test.
- Keep conflict and displacement language neutral, human-centered, and non-stigmatizing.
- Use country naming and territorial representation consistently and document the chosen convention.
- Separate descriptive data from recommendations. Any generated narrative must be reproducible from visible rules.

## 6. Visual and interaction design

Create a full visual concept before implementation and obtain approval before treating it as the production specification. Concept the complete Regional Overview, Country Profile, Context & Pressures workspace, Methodology center, and mobile adaptation; do not produce only a header or hero.

Visual direction:

- Executive, calm, authoritative, and institutionally credible.
- Editorial clarity combined with analytical depth.
- Clean light or carefully controlled neutral theme suitable for screens, projectors, and printed briefings.
- One disciplined accent palette plus accessible semantic colors.
- Do not use red/green alone to communicate status.
- Avoid decorative gradients, glassmorphism, excessive shadows, nested cards, dashboard clutter, emoji headings, and generic KPI-card walls.
- Prefer open layouts, structured bands, ranked tables, small multiples, annotated charts, and a strong geographic focal point.
- Use typography and spacing to establish hierarchy; every container must serve an analytical purpose.
- Keep all interface text and controls code-native.

Charts must prioritize the analytical question rather than visual novelty. Use:

- Ordered bars or dot plots for ranking and gap comparison.
- Distribution-aware views for regional capacities.
- Small multiples or aligned lines for trends.
- Heatmaps for country-capacity scanning.
- Scatterplots only when the relationship is meaningful and coverage is clear.
- Tables as accessible equivalents for all important charts.

Every chart must have a clear title stating the finding or question, a concise subtitle defining the measure, visible unit, source and year access, coverage count, accessible tooltip, keyboard pathway, and downloadable data.

## 7. Briefing, export, and sharing

Add a policy-ready briefing mode that can produce a clean print/PDF layout for:

- Regional briefing.
- Single-country profile.
- Multi-country comparison.
- Selected capacity priority brief.

The briefing must include title, selected filters, generation date, data reference years, key findings, charts/tables, sources, methodology caveats, and page numbers. It must not depend on dark backgrounds or hover interactions. Also support CSV download for the currently filtered data and a copyable share URL.

## 8. Technical architecture

Replace the duplicated single-file implementation with a maintainable component-based frontend while retaining static-host deployment.

Use:

- React, TypeScript, and Vite.
- A tested charting layer. ECharts may be retained if it meets accessibility and export requirements.
- Feature-oriented components for the five product areas.
- Shared design tokens and reusable chart, filter, disclosure, table, empty-state, and provenance components.
- A single application state model for filters, selected countries, peer definitions, and URL synchronization.
- Static generated JSON assets, requiring no runtime application server for normal viewing.

Do not place the complete application in one component and do not duplicate application logic inside generated HTML.

### Canonical data contract

Create a validated schema with, at minimum:

- `DatasetMetadata`: schema version, generated timestamp, last successful refresh, source statuses, methodology version, country count, and warnings.
- `Country`: stable ISO3 identifier, display name, subregion, and versioned classifications.
- `Observation`: indicator ID, country ISO3, numeric or categorical value, unit, reference year, source ID, source URL, retrieval timestamp, missingness status, and quality notes.
- `IndicatorDefinition`: label, description, unit, direction, domain, source, update frequency, comparability notes, and transformation rules.
- `CapacityObservation`: country, capacity ID, value, year, source, and availability status.
- `DerivedMetric`: metric ID, value, population/denominator, calculation version, included observations, exclusions, and warnings.
- `RefreshRun`: source, start/end time, status, records retrieved, validation result, and human-readable error.

Validate data at build time. Fail the publication step when required schema fields, country identifiers, duplicate observations, impossible ranges, or core calculation invariants fail. Permit partial source refreshes only by retaining the last known good snapshot and clearly reporting staleness.

### Data pipeline

Repair the current refresh gap. At present, `build_data.py` writes `data.json`, while the browser reads data embedded in `index.html`; the script also does not recreate all derived fields used by the UI. The rebuilt pipeline must:

1. Fetch WHO, World Bank, and UNHCR data with explicit timeouts, retries, source-specific error handling, and respectful caching.
2. Save raw, timestamped source snapshots for reproducibility.
3. Normalize sources into the canonical schema.
4. Calculate ranks, tied ranks, medians, distributions, trends, coverage, peer groups, counts, and all other derived metrics in one tested module.
5. Validate all output and compare it with the previous snapshot for implausible changes.
6. Publish one versioned processed dataset consumed directly by the frontend.
7. Record last attempted and last successful refresh separately.
8. Preserve the last known good published dataset if a source is unavailable or validation fails.
9. Generate a machine-readable refresh report and a concise visible status summary.

Schedule the pipeline through GitHub Actions, with manual dispatch available. Do not call upstream data APIs from every user’s browser. A failed refresh must fail visibly and must not overwrite the last valid dataset.

Keep the map geometry as a versioned static asset and validate that every mapped feature and country record uses the expected ISO3 code.

## 9. Loading, error, and incomplete-data states

Implement explicit states for:

- Initial data loading.
- Dataset unavailable.
- One upstream source stale or failed.
- Indicator unavailable for the selected country.
- Insufficient years for trend calculation.
- Too few countries for a valid peer comparison or regression.
- Empty filter result.
- Export failure.
- Offline use after the static assets have loaded.

Do not show blank charts, `NaN`, misleading zeros, fabricated lines, or generic “something went wrong” messages where a specific explanation is available.

## 10. Accessibility, localization, and responsiveness

Meet WCAG 2.2 AA expectations:

- Full keyboard navigation and logical focus order.
- Visible focus states.
- Semantic landmarks, headings, labels, and control names.
- Text alternatives and accessible tables for charts.
- Sufficient contrast and color-independent status encoding.
- Screen-reader announcements for filter and selection changes.
- Reduced-motion support.
- Touch targets appropriate for tablets and phones.

Support desktop, tablet, and mobile intentionally. On small screens, preserve the decision workflow and comparison meaning rather than merely stacking every desktop panel.

Prepare the architecture for English and Arabic:

- Externalize all visible strings.
- Support RTL layout and chart-label alignment.
- Use locale-aware number, date, and compact-value formatting.
- Do not hard-code text inside chart configuration where localization cannot reach it.

English delivery is acceptable for the first implementation, but the RTL-ready architecture and a representative Arabic layout test are required.

## 11. Performance and resilience

Set practical targets:

- Initial route usable within 3 seconds on a typical institutional laptop and moderate connection.
- Avoid rendering every heavy chart on initial load.
- Lazy-load secondary workspaces and export code.
- Keep chart resizing stable and prevent layout shift.
- Preserve useful static content if optional chart functionality fails.
- Pin dependencies and avoid runtime CDN dependencies for production.

## 12. Required tests

Implement automated tests for:

- Median, mean, percentile/distribution, and denominator calculations.
- Rank ordering, tied ranks, missing scores, and mixed score years.
- Capacity gaps with missing values.
- Trend calculation with one, two, and multiple observations.
- Peer-group selection and insufficient-peer fallback.
- Filter combinations and URL-state round trips.
- Regression input filtering and residual calculation where retained.
- Source-year and provenance display.
- Schema validation, duplicate detection, range checks, and country-code matching.
- Failed/partial refresh preserving the last known good dataset.
- CSV and briefing export content.
- Keyboard navigation and critical accessibility checks.

Run browser-level tests for:

- Finding a priority country from the landing view.
- Opening its diagnostic from the map and ranking.
- Comparing at least three countries.
- Filtering by conflict status, income, subregion, and capacity.
- Sharing and restoring a filtered URL.
- Downloading filtered data.
- Producing regional, country, and comparison briefings.
- Handling Palestine and other incomplete observations honestly.
- Desktop, tablet, mobile, print, and representative RTL layouts.

## 13. Design and implementation workflow

Follow this order:

1. Audit the existing app and document the retained analytical capabilities, data problems, and terminology changes.
2. Produce complete visual concepts for the four workspaces plus mobile and briefing states.
3. Review the concepts against policy-leader tasks, analytical integrity, accessibility, and implementation feasibility.
4. Establish design tokens, typography, component families, chart grammar, spacing, and interaction rules from the accepted concept.
5. Define and test the canonical data schema and derivation logic.
6. Repair and automate the ingestion pipeline.
7. Implement the application in vertical slices, starting with the Regional Overview and Country Profile.
8. Add comparison, priority, methodology, sharing, and export capabilities.
9. Verify the real rendered interface with browser screenshots against the accepted concepts at desktop, tablet, and mobile sizes.
10. Run functional, analytical, accessibility, print, and performance tests before handoff.

Do not stop at wireframes, mock data, inert controls, or a successful build. The result must be a working product using the supplied real dataset and a reproducible refresh path.

## 14. Acceptance criteria

The implementation is complete only when:

- A policy leader can identify the lowest-prepared countries, shared regional gaps, and relevant contextual pressures within 30 seconds.
- Every displayed value exposes its source and reference year without requiring methodology guesswork.
- Missing values remain missing and visibly explained.
- Palestine’s unavailable capacity profile is not rendered as zero.
- Users can compare at least three countries across preparedness, capacities, trends, and contextual indicators.
- Users can export a briefing-ready regional, country, or comparison report.
- Users can download filtered data and share a URL that restores the selected state.
- Ranking ties, score years, denominators, exclusions, and peer definitions are transparent.
- Spending analysis and other associations use defensible, non-causal terminology.
- Automated refreshes retain the last known good dataset when an upstream source or validation step fails.
- Desktop, tablet, mobile, print, keyboard, screen-reader, reduced-motion, color-vision, and representative RTL checks pass.
- Automated analytical tests cover medians, ties, missing values, mixed years, trends, peer groups, filters, and refresh failures.
- The accepted visual concept and final browser screenshots have been compared directly, and no material fidelity or usability defects remain.

## 15. Final handoff

Deliver:

- The production-ready application.
- The validated canonical dataset and schema.
- The repaired ingestion and derivation pipeline.
- Scheduled and manual refresh workflows.
- Automated analytical, UI, and accessibility tests.
- Methodology and indicator documentation.
- A data-quality and refresh-status report.
- Print/PDF briefing templates and CSV export.
- A concise migration note explaining what changed from the static prototype.
- A verification report covering concept fidelity, core workflows, responsive behavior, accessibility, analytical correctness, and known limitations.

Use the existing repository as the source of truth. When requirements conflict, prioritize analytical integrity, transparent uncertainty, accessibility, and the primary policy decision workflow over adding more charts or decorative complexity.
