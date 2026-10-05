# PREPARE MENA

A static-hostable React + TypeScript decision-support dashboard covering reported epidemic-preparedness capacity across 21 MENA countries, built for the AUB Global Health Institute.

The five workspaces are Regional Overview, Context & Pressures, Country Profile , About, and Methodology & Data quality. Country Profile  combines reported capacity evidence, trends, peer comparisons, and health-system context to support country-owned review.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5.7, Vite 6 |
| Charts | ECharts 5 |
| PDF export | `@react-pdf/renderer` |
| Data refresh | Python 3.12 (`build_data.py`) |
| Tests | Vitest (unit), Playwright (e2e) |
| Package manager | npm |

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

## Quality checks

```bash
npm test           # unit tests (vitest)
npm run lint       # eslint
npm run test:e2e   # browser smoke tests (playwright)
npm run build
python3 scripts/validate_data.py public/data.json
```

## Data refresh

`build_data.py` retrieves WHO GHO SPAR, World Bank, and UNHCR observations, derives regional metrics and tied rankings, validates core invariants, and publishes the canonical dataset to `data.json` and `public/data.json`.

```bash
python3 build_data.py
```

The monthly GitHub Actions workflow (`refresh-data.yml`) runs automatically on the 1st of every month and can also be triggered manually. Failed or incomplete source retrieval stops before publication, preserving the previously published dataset.

## Docker

```bash
# Build and run
docker compose up --build

# Available at http://localhost:8081
```

The Dockerfile is multi-stage: `node:22-alpine` builds the Vite SPA, `nginx:1.27-alpine` serves the static output. All base images pull from the GHI private ECR mirror (`883907968008.dkr.ecr.eu-west-1.amazonaws.com`).

Authenticate to ECR before building:
```bash
aws ecr get-login-password --region eu-west-1 --profile me216 | \
  docker login --username AWS --password-stdin \
  883907968008.dkr.ecr.eu-west-1.amazonaws.com
```

## CI/CD

| Trigger | Workflow | Action |
|---|---|---|
| 1st of every month 05:17 UTC | `refresh-data.yml` | Fetch WHO/WB/UNHCR data, validate, commit `data.json` back to `main` |
| Manual (`workflow_dispatch`) | `refresh-data.yml` | Same as above |

> A Docker build + ECR push + ECS deploy workflow is pending for production deployment on AWS ECS Fargate.

## Interface features

- Light and dark themes; follows system preference and persists the toggle
- Browser back/forward navigate between workspaces and countries
- Map year slider replays any SPAR reference year; "Latest" shows each country's most recent report
- Country Profile  supports a second-country comparison overlay on the capacity radar and tables
- "What changed" digest surfaces the largest SPAR movements between each country's two most recent reference years

## Important interpretation limits

- SPAR scores are State Party self-assessments of reported capacity, not independent audits or measures of outbreak performance
- Indicators may use different reference years
- Missing values are excluded rather than converted to zero
- Cross-sectional associations do not establish causality or investment efficiency
- WHO benchmark and NAPHS references are planning prompts, not automatic recommendations
- The WHO detailed-capacity query currently contains no published domain observations for Occupied Palestinian territory; its reported 2025 composite remains visible

## Repository notes

- `NEXT_LEVEL_DASHBOARD_PROMPT.md` — full product specification
- `docs/app-qc-ledger.md` — implementation and verification evidence
- `public/data.json` — live dataset served by the app (auto-refreshed monthly)
