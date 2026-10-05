# Changelog

All notable changes to PREPARE MENA are documented here.

## [Unreleased]

## [2.1.0] — 2026-08-19

### Added
- Docker support: multi-stage `Dockerfile` (node:22-alpine build → nginx:1.27-alpine serve)
- `nginx.conf`: SPA fallback, immutable asset caching, no-cache on `index.html`
- `docker-compose.yml`: single service with restart policy and nginx healthcheck
- `.dockerignore`
- All base images pull from GHI private ECR mirror

### Changed
- README updated with Docker, CI/CD, and stack documentation

## [2.0.1] — 2026-08-19

### Changed
- Refined dashboard experience: layout, typography, and interaction polish

## [2.0.0] — 2026-07-02

### Removed
- Arabic localization and RTL layout removed; About page rebuilt in English only

### Added (Phase 4)
- Playwright smoke test suite (`tests/smoke.spec.ts`)
- README feature notes

### Added (Phase 2 + 3)
- Light/dark theme toggle persisted to localStorage
- Map year slider — replay any SPAR reference year; "Latest" mode
- Country comparison overlay on capacity radar and tables
- "What changed" digest — largest SPAR movements between two most recent reference years
- Arabic RTL layout (subsequently removed in 2.0.0)

### Added (Phase 1)
- Browser back/forward navigation between workspaces and countries
- Inter variable font
- Refined type scale and panel polish
- Loading skeletons
- Searchable country picker

## [1.0.0] — 2026-07-02

### Added
- Baseline PREPARE MENA dashboard synced from Replit (2 Jul 2026)
- React 18 + TypeScript + Vite 6 SPA
- Five workspaces: Regional Overview, Context & Pressures, Country Profile , About, Methodology
- ECharts 5 visualizations
- `build_data.py` — WHO GHO SPAR, World Bank, UNHCR data pipeline
- Monthly GitHub Actions data refresh workflow (`refresh-data.yml`)
- Vitest unit tests, Playwright e2e smoke suite
- PDF briefing export via `@react-pdf/renderer`
