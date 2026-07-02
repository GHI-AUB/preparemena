# PREPARE MENA

A static-hostable React and TypeScript decision-support product covering reported epidemic-preparedness capacity across 21 MENA countries.

The five workspaces are Regional Overview, Context & Pressures, Country Profile, About, and Methodology & Data Quality. Country Profile combines reported capacity evidence, trends, peer comparisons, and health-system context to support country-owned review.

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm test
npm run build
python3 scripts/validate_data.py public/data.json
```

## Data refresh

`build_data.py` retrieves WHO GHO SPAR, World Bank, and UNHCR observations, derives regional metrics and tied rankings, validates core invariants, and publishes the same canonical dataset to `data.json` and `public/data.json`.

```bash
python3 build_data.py
```

The monthly GitHub Actions workflow can also be triggered manually. Failed or incomplete source retrieval stops before publication, preserving the previously published dataset.

## Important interpretation limits

- SPAR scores are State Party self-assessments of reported capacity, not independent audits or measures of outbreak performance.
- Indicators may use different reference years.
- Missing values are excluded rather than converted to zero.
- Cross-sectional associations do not establish causality or investment efficiency.
- WHO benchmark and NAPHS references are planning prompts, not automatic recommendations.
- The WHO detailed-capacity query currently contains no published domain observations for occupied Palestinian territory; its reported 2025 composite remains visible.

## Repository notes

- `NEXT_LEVEL_DASHBOARD_PROMPT.md` contains the full product specification.
- `docs/app-qc-ledger.md` records implementation and verification evidence.
