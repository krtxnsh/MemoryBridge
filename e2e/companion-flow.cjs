/*
 * MemoryBridge end-to-end browser flow (Playwright, real backend + DB).
 *
 * Exercises the principal demonstration path through the actual UI:
 *   caregiver demo sign-in -> verified memories load -> companion recall of a
 *   verified memory -> safe fallback for an unknown question -> persistence
 *   across reload -> unauthorised data is not reachable.
 *
 * Run it via e2e/run-e2e.sh, which boots PostgreSQL, the API and the Vite dev
 * server first. Uses the pre-installed Playwright chromium (no options needed).
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
const ART = path.join(__dirname, 'artifacts');
fs.mkdirSync(ART, { recursive: true });

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
const shot = (page, n) => page.screenshot({ path: path.join(ART, n), fullPage: false }).catch(() => {});

async function bodyText(page) {
  return (await page.evaluate(() => document.body.innerText)).toLowerCase();
}
async function waitForText(page, needle, timeout = 15000) {
  const lc = needle.toLowerCase();
  await page.waitForFunction(
    (n) => document.body.innerText.toLowerCase().includes(n),
    lc,
    { timeout }
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  try {
    // 1. Landing loads
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await waitForText(page, 'every memory deserves');
    check('Landing page renders', true);
    await shot(page, '01-landing.png');

    // 2. Caregiver demo sign-in (hits the real backend /auth/demo)
    await page.getByRole('button', { name: /Try Caregiver Demo/i }).click();
    await page.waitForURL(/\/family/, { timeout: 20000 });
    check('Caregiver demo sign-in reaches /family', true, page.url());
    await shot(page, '02-caregiver-overview.png');

    // 2b. Regression guard: every domain resource must load from the backend —
    // no silent fallback and no "could not be loaded" error toast.
    await page.waitForTimeout(1800);
    const afterLogin = await bodyText(page);
    check(
      'All workspace data loads (no data-load error toast)',
      !afterLogin.includes('could not be loaded from the server')
    );

    // 3. Verified memories load from the backend into the library
    await page.goto(`${BASE}/family/library`, { waitUntil: 'networkidle' });
    await waitForText(page, 'red bicycle', 20000);
    check('Seeded verified memory "Red Bicycle" loads in the library', true);
    await shot(page, '03-library.png');

    // 4. Companion recall of a verified memory (patient companion screen)
    await page.goto(`${BASE}/patient/companion`, { waitUntil: 'networkidle' });
    const input = page.locator('input[placeholder*="ask a question" i]');
    await input.waitFor({ timeout: 15000 });
    await input.fill('Tell me about the red bicycle');
    await page.getByRole('button', { name: /Send message/i }).click();
    await waitForText(page, 'bicycle', 20000);
    const recallText = await bodyText(page);
    const grounded =
      recallText.includes('bicycle') && !recallText.includes("don't have that memory");
    check('Companion recalls the verified memory (grounded answer)', grounded);
    await shot(page, '04-companion-recall.png');

    // 5. Unknown question -> exact safe fallback, no invention
    await input.fill('What is the stock market price today?');
    await page.getByRole('button', { name: /Send message/i }).click();
    await waitForText(page, "don't have that memory", 20000);
    check('Unknown question returns the safe fallback', true);
    await shot(page, '05-safe-fallback.png');

    // 6. Persistence across reload (still signed in, data still present)
    await page.goto(`${BASE}/family/library`, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    let persisted = false;
    try {
      await waitForText(page, 'red bicycle', 15000);
      persisted = !page.url().endsWith('/');
    } catch {
      persisted = false;
    }
    check('Session and memories persist after reload', persisted, page.url());
    await shot(page, '06-after-reload.png');

    // 7. Unauthorised access: a signed-out browser cannot reach caregiver pages
    const anon = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const anonPage = await anon.newPage();
    await anonPage.goto(`${BASE}/family/library`, { waitUntil: 'networkidle' });
    await anonPage.waitForTimeout(1200);
    const redirected = anonPage.url().endsWith('/') || !anonPage.url().includes('/family');
    const anonBody = (await anonPage.evaluate(() => document.body.innerText)).toLowerCase();
    check(
      'Signed-out user is redirected away from caregiver pages',
      redirected && !anonBody.includes('red bicycle'),
      anonPage.url()
    );
    await anon.close();

    if (errors.length) console.log('Console/page errors:', errors.slice(0, 5));
  } catch (err) {
    check('E2E run completed without exceptions', false, err.message);
    await shot(page, '99-failure.png');
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  process.exit(failed.length === 0 ? 0 : 1);
})();
