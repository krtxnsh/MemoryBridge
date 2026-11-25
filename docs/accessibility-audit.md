# MemoryBridge — Accessibility Audit

Tooling: **Lighthouse 12** (accessibility category) on the public landing page,
and **axe-core 4.10** (WCAG 2.0/2.1 A & AA rules) on the landing page and the
authenticated patient and caregiver screens, driven by Playwright/Chromium
against the **production build** (`vite preview` + API).

## Results (after fixes)

| Screen | Tool | Before | After |
| --- | --- | ---: | ---: |
| Landing | Lighthouse accessibility | 89 | **94** |
| Caregiver Library | axe color-contrast nodes | 61 | **16** |
| Patient Home | axe color-contrast nodes | 4 | **2** |
| Patient Companion | axe color-contrast nodes | 2 | **1** |
| Landing | axe color-contrast nodes | 4 | **2** |
| Caregiver Library | axe `select-name` (critical) | 2 | **0** |
| Landing (mobile) | Lighthouse `link-name` | fail | **pass** |

## Fixes applied
- **Unlabeled form controls (critical `select-name`)** — added `aria-label`s to the
  library filters, routine period/category, and storybook album selects.
- **Icon-only link (`link-name`)** — the header "Overview" link is icon-only at
  mobile width; added an `aria-label`.
- **Low-contrast secondary text (bulk `color-contrast`)** — darkened the design
  tokens `ink-secondary` (`#77716B` → `#6B655F`) and `ink-muted`
  (`#A29C95` → `#787168`). `#6B655F` meets WCAG AA (≥4.5:1) on both the warm-white
  (`5.66:1`) and cream (`5.13:1`) backgrounds, where the old value failed on cream
  (`4.30:1`). This resolved ~45 of the 61 library findings without changing the
  brand identity.

## Known residual items (triaged)
The remaining axe `color-contrast` findings are brand-colour trade-offs:
- The terracotta brand colour `#F36B32` used as **small** text, and white text on
  a terracotta button (~3:1). These **pass** WCAG AA for large/bold text
  (≥3:1), which is how most occurrences are rendered (bold button labels).
- One amber "Pending" badge on pale yellow (~3:1).

All of these are fully covered by the shipped **High Contrast mode** (header
toggle / Caregiver Settings), which darkens text, buttons and borders to strong
ratios. The design system also provides `primary-text` (`#B8431A`) as the
text-safe accent for body-sized orange text. Changing the core brand terracotta
is out of scope for this pass (see the design-system constraints in the README).

## Reproduce
```bash
# Lighthouse (landing)
CHROME_PATH=<chromium> npx lighthouse http://127.0.0.1:4173/ \
  --only-categories=accessibility --chrome-flags="--headless=new --no-sandbox"

# axe-core on authenticated screens: build + `vite preview` (proxies /api),
# run the API, then drive Playwright + axe-core across the screens.
```
Non-visual accessibility already in place: reduced-motion (OS + toggle), text-size
switcher, ≥56px patient touch targets, visible focus rings, voice-transcript
confirmation, and no autoplay audio.
