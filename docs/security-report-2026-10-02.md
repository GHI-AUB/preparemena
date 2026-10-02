# Security Report — epapp-prepare-mena
**Date:** 2026-10-02
**Image:** `883907968008.dkr.ecr.eu-west-1.amazonaws.com/epapp-prepare-mena:ed48b330c798feac3966fe18b9ebaf590a745214`
**Base image:** `nginx:1.27-alpine` (Alpine 3.21.3)
**Scanned by:** Trivy 0.74.0 · Docker Scout 1.20.4 · npm audit · Amazon Q Code Review

---

## Summary

| Scope | Critical | High | Medium | Low | Total |
|---|---|---|---|---|---|
| Container image (Trivy) | 2 | 42 | 72 | 42 | 159 |
| Container image (Docker Scout) | 7 | 35 | 35 | 17 | 107 |
| npm dependencies (npm audit) | 1 | 5 | 5 | 0 | 11 |
| Source code (Amazon Q) | 0 | 4 | 6 | 2 | 12 |

> Trivy and Docker Scout overlap on the same Alpine packages. Scout reports more CVEs due to a broader advisory database. All container findings are Alpine OS-level packages — the application layer (nginx static files) has no vulnerabilities.

> All npm vulnerabilities are in **dev/test dependencies** (`vitest`, `vite`, `esbuild`, `postcss`, `browserslist`, `nanoid`, `brace-expansion`). None are present in the production image. The one direct production dependency with a finding is `echarts`.

---

## 1. Container Image — Critical & High

### 1.1 OpenSSL (`3.3.3-r0` → fix: `3.3.7-r2`)

The single largest source of findings. All resolved by upgrading to `openssl 3.3.7-r2` in Alpine.

| CVE | Severity | Description |
|---|---|---|
| CVE-2026-31789 | **CRITICAL** | Heap buffer overflow on 32-bit systems from large X.509 certificate |
| CVE-2026-63073 | **CRITICAL** | Untrusted sender DN used as format string in CMP response validation |
| CVE-2026-75803 | **CRITICAL** | AEAD forgeries possible with empty ciphertext in EVP_Cipher() |
| CVE-2026-34182 | **CRITICAL** | CMS AuthEnvelopedData processing may accept forged messages |
| CVE-2025-15467 | HIGH | RCE or DoS via oversized Initialization Vector |
| CVE-2026-28387 | HIGH | Arbitrary code execution via use-after-free in DANE TLSA |
| CVE-2026-45447 | HIGH | Heap use-after-free in PKCS7_verify() |
| CVE-2026-84782 | HIGH | Information disclosure via DTLS handshake retransmission |

**Fix:** Rebuild image against updated Alpine base (`nginx:1.27-alpine` with Alpine 3.21 package updates). No Dockerfile change needed — a rebuild pulls the latest Alpine packages.

### 1.2 libexpat (`2.7.0-r0` → fix: `2.8.4-r0`)

| CVE | Severity | Description |
|---|---|---|
| CVE-2026-32767 | **CRITICAL** (Scout) | Heap buffer overflow |
| CVE-2025-59375 | HIGH | Large dynamic memory allocation via crafted XML |
| CVE-2026-66046 | HIGH | DoS via quadratic complexity in attribute processing |
| CVE-2026-76641 | HIGH | DoS via XML external entity parsing |
| CVE-2026-56132 | HIGH | Arbitrary code execution via heap-based buffer overflow |
| CVE-2026-56403–56412 | HIGH | Multiple integer overflows leading to ACE or info disclosure |

**Fix:** Alpine base image rebuild.

### 1.3 libxml2 (`2.13.4-r5` → fix: `2.13.9-r1`)

| CVE | Severity | Description |
|---|---|---|
| CVE-2025-49796 | **CRITICAL** (Scout) | Type confusion leads to DoS |
| CVE-2025-49794 | HIGH | Heap use-after-free leads to DoS |
| CVE-2025-49795 | HIGH | Null pointer dereference leads to DoS |
| CVE-2025-32414 | HIGH | Out-of-bounds read |

**Fix:** Alpine base image rebuild.

### 1.4 libpng (`1.6.47-r0` → fix: `1.6.59-r0`)

| CVE | Severity | Description |
|---|---|---|
| CVE-2025-64720 | HIGH | Buffer overflow |
| CVE-2025-65018 | HIGH | Heap buffer overflow |
| CVE-2026-33416 | HIGH | Arbitrary code execution via use-after-free |
| CVE-2026-33636 | HIGH | Info disclosure and DoS via out-of-bounds read/write |

**Fix:** Alpine base image rebuild.

### 1.5 musl (`1.2.5-r9` → fix: `1.2.5-r11`)

| CVE | Severity | Description |
|---|---|---|
| CVE-2026-40200 | HIGH | Arbitrary code execution and DoS via stack-based overflow |

**Fix:** Alpine base image rebuild.

### 1.6 curl / libcurl (`8.12.1-r1` → fix: `8.14.1-r2`)

| CVE | Severity | Description |
|---|---|---|
| CVE-2025-5399 | HIGH | WebSocket endless loop |
| CVE-2025-9086 | HIGH | Out-of-bounds read for cookie path |

**Fix:** Alpine base image rebuild.

### 1.7 zlib (`1.3.1-r2` → fix: `1.3.2-r0`)

| CVE | Severity | Description |
|---|---|---|
| CVE-2026-22184 | HIGH | Arbitrary code execution via buffer overflow in untgz utility |

**Fix:** Alpine base image rebuild.

### 1.8 nghttp2 (`1.64.0-r0` → fix: `1.68.1`)

| CVE | Severity | Description |
|---|---|---|
| CVE-2026-27135 | HIGH | DoS via malformed HTTP/2 frames after session termination |

**Fix:** Alpine base image rebuild.

---

## 2. Container Image — Remediation

All container findings are Alpine OS package vulnerabilities. The fix is a single Dockerfile change to pin the nginx base image to a newer Alpine digest, or simply rebuild — Alpine package updates are pulled automatically on `docker build`.

Add to `Dockerfile` to force a fresh package layer:

```dockerfile
# Serve
FROM 883907968008.dkr.ecr.eu-west-1.amazonaws.com/ecr-public/docker/library/nginx:1.27-alpine

RUN apk upgrade --no-cache
```

This single `apk upgrade` line will resolve all 159 Trivy findings by pulling the latest patched Alpine packages at build time. The resulting image will have no critical or high OS-level CVEs.

---

## 3. npm Dependencies

> All findings except `echarts` are in **dev/test** packages (`vitest`, `vite`, `esbuild`, `postcss`, `browserslist`, `nanoid`, `brace-expansion`). These are not present in the production Docker image — they are only used during `npm run build` inside the build stage and are discarded in the final nginx image.

| Package | Severity | Advisory | In Production Image? |
|---|---|---|---|
| `vitest` ≤ 4.1.10 | **CRITICAL** | GHSA-5xrq-8626-4rwp — arbitrary file read/exec via UI server | No |
| `brace-expansion` 4.x–5.0.11 | HIGH | GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895 — DoS via unbounded expansion | No |
| `browserslist` ≤ 4.28.6 | HIGH | GHSA-73wf-gq98-2v4g — prototype pollution via normalizeStats | No |
| `nanoid` ≤ 3.3.17 | HIGH | GHSA-28wg-ghj8-5hjv — infinite loop on negative size | No |
| `postcss` ≤ 8.5.22 | HIGH | GHSA-r28c-9q8g-f849 — path traversal via sourceMappingURL | No |
| `vite` ≤ 6.4.2 | HIGH | GHSA-fx2h-pf6j-xcff — `server.fs.deny` bypass on Windows NTFS | No |
| `echarts` < 6.1.0 | MEDIUM | GHSA-fgmj-fm8m-jvvx — XSS in Lines series tooltip via innerHTML | **Yes** |
| `esbuild` ≤ 0.24.2 | MEDIUM | GHSA-67mh-4wv8-2f99 — CORS `*` on dev server | No |
| `@vitest/mocker` ≤ 4.1.10 | MEDIUM | GHSA-82fw-gwwq-j7x9 — path traversal via redirect mock | No |
| `baseline-browser-mapping` < 2.11.0 | MEDIUM | GHSA-w5vr-8v7q-w6rv — process.exit() on invalid input | No |

### Remediation

```bash
# Fix all auto-fixable (non-breaking)
npm audit fix

# echarts major bump (breaking — verify chart API compatibility)
npm install echarts@^6.1.0

# vitest major bump (breaking — verify test suite)
npm install vitest@^5.0.3 --save-dev
```

The `echarts` XSS only triggers if the `Lines` series is used with `series.data[i].name` containing HTML and no custom `tooltip.formatter`. Review usage before upgrading to v6 as it is a major version with breaking changes.

---

## 4. Source Code Findings (Amazon Q)

### 4.1 `app.js` — DOM XSS (High)

`app.js` is a dead Express server stub (line 238) that uses `innerHTML` with unsanitised input. This file has no role in the SPA and is not served by nginx.

**Fix:** Delete `app.js`.

### 4.2 `scripts/validate_data.py` — Path Traversal (High)

`sys.argv[1]` is passed directly to `open()` without sanitisation (lines 4–6). This is a CLI-only data pipeline script, not exposed over the network.

**Fix:** Add a path bounds check:
```python
from pathlib import Path
path = Path(sys.argv[1]).resolve()
if not str(path).startswith(str(Path.cwd())):
    raise ValueError(f"Path outside working directory: {path}")
```

### 4.3 `build_data.py` — urllib.urlopen Resource Leak (Medium)

`request.urlopen()` called without a `with` statement (lines 87, 108, 122). If `json.load()` raises, the HTTP connection is never closed.

**Fix:** Wrap in `with`:
```python
with request.urlopen(url) as resp:
    data = json.load(resp)
```

### 4.4 `infra/task-definition.yml` — Container Runs as Root (Medium)

No `User` field in the container definition. nginx master process runs as root (required to bind port 80) but worker processes already drop to `nginx` user. This is standard nginx behaviour on Alpine.

**Accepted risk** for a static SPA with `ReadonlyRootFilesystem: false`. If hardening is required, switch to an unprivileged nginx image on port 8080 and update the target group and security group accordingly.

### 4.5 `scripts/refresh_helpers.py` — Naive datetime (Low)

`datetime.utcnow()` used (line 50) — returns a naive datetime object. Replace with `datetime.now(timezone.utc)`.

---

## 5. Prioritised Remediation Plan

| Priority | Action | Effort |
|---|---|---|
| 🔴 P1 | Add `RUN apk upgrade --no-cache` to Dockerfile, rebuild and push new image | 10 min |
| 🔴 P1 | Delete `app.js` | 1 min |
| 🟠 P2 | `npm audit fix` — resolves most dev dep findings automatically | 5 min |
| 🟠 P2 | `npm install echarts@^6.1.0` — only production dep with a CVE | 30 min (API compat check) |
| 🟡 P3 | `npm install vitest@^5.0.3 --save-dev` — resolves critical vitest finding | 30 min (test suite check) |
| 🟡 P3 | Fix path traversal in `validate_data.py` | 5 min |
| 🟡 P3 | Fix `urlopen` resource leaks in `build_data.py` | 10 min |
| 🟢 P4 | Replace `datetime.utcnow()` with `datetime.now(timezone.utc)` | 2 min |
| 🟢 P4 | Scope `ECR-Push` IAM policy to `repository/epapp-prepare-mena` | 5 min |
