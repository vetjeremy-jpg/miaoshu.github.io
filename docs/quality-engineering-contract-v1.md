# Moonlit Quality Engineering Contract v1

Moonlit Stories is in stable-maintenance mode. Quality work must protect the existing reading experience rather than redesign it.

## Blocking contracts

1. **Static integrity** — local links/assets, HTML/PWA requirements, SEO, sitemap/canonical and publishing rules must pass.
2. **Asset budget** — no new file above 1 MiB; known large assets may not grow. Runtime references are reported for removal/optimization review.
3. **Homepage performance** — 320/375/390/430 px must remain within request, transfer, image, LCP, CLS and interaction budgets.
4. **PWA version integrity** — critical versioned shell assets in `sw.js` must exactly match `index.html`; navigation remains network-first and SW lifecycle takeover remains enabled.
5. **Runtime zero-error** — first-party routes must not emit page errors, same-origin failed requests or HTTP 4xx/5xx.
6. **Third-party resilience** — homepage, gallery and video routes must remain usable when Instagram/YouTube/Facebook media hosts are unavailable.
7. **Reader journey / navigation / accessibility** — existing P0/P1, release-candidate, novel-reader and critical accessibility contracts remain blocking.

## Stable-maintenance rules

- Do not change layout, visual hierarchy, Moon/Logo/Hero, typography or mobile composition for quality-engineering-only PRs.
- Prefer regression contracts over additional CSS overrides.
- Existing technical debt may be baselined only when removal is unsafe; the baseline must never permit growth.
- A production deployment is not considered verified until Production Smoke confirms the live fingerprints and critical routes.
- Third-party failures must degrade locally and must never break first-party navigation or reading.

## Merge rule

A quality-engineering PR is mergeable only after its applicable GitHub Actions checks pass. If a new contract exposes pre-existing debt, fix the contract or isolate the debt explicitly; do not hide failures by weakening unrelated thresholds.
