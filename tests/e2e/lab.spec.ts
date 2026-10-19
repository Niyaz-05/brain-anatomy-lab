import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

const SHOTS = 'docs/screenshots';
fs.mkdirSync(SHOTS, { recursive: true });

async function open(page: Page, query = '') {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`/${query}`);
  return errors;
}
async function ready(page: Page) {
  await expect(page.locator('.viewer[data-ready="true"]')).toBeVisible({ timeout: 90_000 });
  await settle(page);
}
/** Waits until the canvas has rendered two more frames (software WebGL can be slow to compile shaders). */
async function settle(page: Page, ms = 1000) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(ms);
}
const detailTitle = (page: Page) => page.locator('#detail-title');
const listButton = (page: Page, name: string | RegExp) => page.locator('.struct-list button', { hasText: name });
const radio = (page: Page, name: string) => page.getByRole('radio', { name, exact: true });

test('loads a realistic brain without console errors and with a clean main screen', async ({ page }) => {
  const errors = await open(page);
  await ready(page);
  await expect(page.getByRole('heading', { name: 'Human Brain', level: 1 })).toBeVisible();
  await expect(page.locator('aside.right')).toHaveCount(0);
  await expect(radio(page, 'Real')).toHaveAttribute('aria-checked', 'true');
  await page.screenshot({ path: `${SHOTS}/01-initial.png` });
  expect(errors).toEqual([]);
});

test('clicking the model selects the structure under the pointer', async ({ page }) => {
  await open(page);
  await ready(page);
  const box = (await page.locator('.viewer canvas').boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.45);
  await expect(detailTitle(page)).toHaveText(/./);
  await expect(page.locator('aside.right')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/02-selected.png` });
});

test('search finds Broca, Heschl and the circle of Willis', async ({ page }) => {
  await open(page);
  await ready(page);
  const search = page.getByLabel('Search structures');
  await search.fill('Broca');
  await search.press('Enter');
  await expect(detailTitle(page)).toHaveText("Broca's area");
  await search.fill('heschl');
  await expect(page.locator('.search-results')).toContainText("Transverse temporal gyrus (Heschl's) (left)");
  await search.fill('circle of willis');
  await expect(page.locator('.search-results')).toContainText('Anterior communicating artery');
  await search.fill('zzzz');
  await expect(page.getByText('No structure matches')).toBeVisible();
  await search.press('Escape');
  await expect(page.locator('fieldset.layers')).toBeVisible();
});

test('a lobe lists its gyri and a gyrus links to its lobe and area', async ({ page }) => {
  await open(page);
  await ready(page);
  await listButton(page, /^Frontal lobe$/).first().click();
  await expect(detailTitle(page)).toHaveText('Frontal lobe (left)');
  await expect(page.locator('aside.right')).toContainText('parts');
  await page.locator('aside.right .chips button', { hasText: /^Precentral gyrus$/ }).click();
  await expect(detailTitle(page)).toHaveText('Precentral gyrus (left)');
  await page.locator('aside.right .chip-row button', { hasText: 'Primary motor cortex' }).click();
  await expect(detailTitle(page)).toHaveText('Primary motor cortex (left)');
});

test('colour modes paint the lobes and functional areas', async ({ page }) => {
  await open(page);
  await ready(page);
  const canvas = page.locator('.viewer canvas');
  const real = await canvas.screenshot();
  await radio(page, 'Lobes').click();
  await settle(page);
  const lobes = await canvas.screenshot();
  expect(Buffer.compare(real, lobes)).not.toBe(0);
  await page.screenshot({ path: `${SHOTS}/03-colour-lobes.png` });
  await radio(page, 'Areas').click();
  await settle(page);
  expect(Buffer.compare(lobes, await canvas.screenshot())).not.toBe(0);
  await page.screenshot({ path: `${SHOTS}/04-colour-areas.png` });
});

test('layers hide and show structures', async ({ page }) => {
  await open(page);
  await ready(page);
  await page.getByLabel('Arteries').uncheck();
  await expect(listButton(page, /^Basilar artery/).locator('.tag')).toHaveText('hidden');
  await page.getByLabel('Arteries').check();
  await expect(listButton(page, /^Basilar artery/).locator('.tag')).toHaveCount(0);
  await page.getByLabel('Cerebral cortex (gyri)').uncheck();
  await expect(listButton(page, /^Precentral gyrus/).first()).toHaveClass(/is-hidden/);
});

test('isolate, zoom and reset', async ({ page }) => {
  await open(page);
  await ready(page);
  await listButton(page, /^Thalamus \(left\)$/).click();
  await page.getByLabel('Isolate').check();
  await expect(listButton(page, /^Pons/).locator('.tag')).toHaveText('hidden');
  await page.getByRole('button', { name: 'Zoom to' }).click();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/05-isolated-thalamus.png` });
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(detailTitle(page)).toHaveCount(0);
  await expect(listButton(page, /^Pons/).locator('.tag')).toHaveCount(0);
});

test('camera presets switch views', async ({ page }) => {
  await open(page);
  await ready(page);
  const canvas = page.locator('.viewer canvas');
  const left = await canvas.screenshot();
  await page.getByRole('button', { name: 'Bottom', exact: true }).click();
  await settle(page, 1200);
  expect(Buffer.compare(left, await canvas.screenshot())).not.toBe(0);
  await page.screenshot({ path: `${SHOTS}/06-base-circle-of-willis.png` });
});

test('labels mode shows non-overlapping labels for the near hemisphere', async ({ page }) => {
  await open(page);
  await ready(page);
  await page.getByLabel('Labels').check();
  await settle(page, 1500);
  const shown = page.locator('.scene-label[data-state="shown"]');
  expect(await shown.count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator('.scene-label[data-state="shown"]', { hasText: '(right)' })).toHaveCount(0);
  const boxes = await shown.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.left, r.top, r.right, r.bottom]));
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const [a, b] = [boxes[i]!, boxes[j]!];
    expect(!(a[2]! <= b[0]! || b[2]! <= a[0]! || a[3]! <= b[1]! || b[3]! <= a[1]!), `labels ${i} and ${j} overlap`).toBe(false);
  }
  await page.screenshot({ path: `${SHOTS}/07-labels.png` });
});

test('the cut shows the inside of the brain and can be moved, flipped and turned off', async ({ page }) => {
  const errors = await open(page);
  await ready(page);
  const canvas = page.locator('.viewer canvas');
  const whole = await canvas.screenshot();
  await radio(page, 'Front').click();
  await expect(radio(page, 'Front')).toHaveAttribute('aria-checked', 'true');
  await page.getByLabel('Cut position').fill('0.1');
  await page.getByRole('button', { name: 'Front', exact: true }).click();
  await settle(page, 2500);
  const cut = await canvas.screenshot();
  expect(Buffer.compare(whole, cut)).not.toBe(0);
  await page.screenshot({ path: `${SHOTS}/08-cut-coronal.png` });
  await page.getByRole('button', { name: 'Flip' }).click();
  await expect(page.getByRole('button', { name: 'Flip' })).toHaveAttribute('aria-pressed', 'true');
  await radio(page, 'Top').click();
  await page.getByLabel('Cut position').fill('0.2');
  await page.getByRole('button', { name: 'Top', exact: true }).click();
  await page.getByRole('button', { name: 'Flip' }).click();
  await settle(page, 2500);
  await page.screenshot({ path: `${SHOTS}/09-cut-axial.png` });
  await radio(page, 'Off').click();
  await expect(page.getByLabel('Cut position')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('inside view fades the cortex and runs the CSF flow', async ({ page }) => {
  const errors = await open(page);
  await ready(page);
  await page.getByRole('button', { name: 'Inside', exact: true }).click();
  await expect(page.locator('.csf-panel')).toBeVisible();
  await expect(page.locator('.csf-panel .flow-steps li')).toHaveCount(7);
  await settle(page, 2500);
  await page.screenshot({ path: `${SHOTS}/10-inside-csf.png` });
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  await page.locator('.csf-panel .flow-steps button', { hasText: 'Cerebral aqueduct' }).click();
  await expect(detailTitle(page)).toHaveText('Cerebral aqueduct');
  expect(errors).toEqual([]);
});

test('guided tour navigates forward, back, through cuts, and finishes', async ({ page }) => {
  // Eight camera flights and two cuts: slow under software WebGL.
  test.slow();
  await open(page);
  await ready(page);
  await page.getByRole('button', { name: 'Guided tour' }).click();
  await expect(page.getByText(/step 1 of 11/)).toBeVisible();
  await expect(page.locator('#tour-title')).toHaveText('The lobes of the cerebrum');
  await settle(page, 1200);
  await page.screenshot({ path: `${SHOTS}/11-tour-lobes.png` });
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.locator('#tour-title')).toHaveText('Deep grey matter');
  await settle(page, 2500);
  await page.screenshot({ path: `${SHOTS}/12-tour-deep-grey-matter.png` });
  await page.getByRole('button', { name: '← Back' }).click();
  await expect(page.getByText(/step 6 of 11/)).toBeVisible();
  await page.locator('.tour-index button').last().click();
  await expect(page.getByText(/step 11 of 11/)).toBeVisible();
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByRole('button', { name: 'Anatomy' })).toHaveAttribute('aria-pressed', 'true');
});

test('phone layout: structures open from the dock and details follow a pick', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await ready(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.locator('aside.left')).toBeHidden();
  await page.getByRole('button', { name: 'Structures' }).click();
  await listButton(page, /^Occipital lobe$/).first().click();
  await expect(page.locator('aside.left')).toBeHidden();
  await expect(detailTitle(page)).toHaveText('Occipital lobe (left)');
  await page.screenshot({ path: `${SHOTS}/13-phone.png` });
});

test('the About sheet holds the HuBMAP, Allen and BodyParts3D credits', async ({ page }) => {
  await open(page);
  await ready(page);
  await page.getByRole('button', { name: /About this lab/ }).click();
  const dialog = page.getByRole('dialog', { name: 'About this lab' });
  await expect(dialog).toContainText('HuBMAP');
  await expect(dialog).toContainText('Allen');
  await expect(dialog).toContainText('BodyParts3D');
  await expect(dialog).toContainText('CC Attribution 4.0');
  await page.screenshot({ path: `${SHOTS}/14-about.png` });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('without WebGL the learning content still works', async ({ page }) => {
  await open(page, '?nowebgl');
  await expect(page.getByRole('heading', { name: '3D view unavailable' })).toBeVisible();
  await listButton(page, /^Pons$/).click();
  await expect(detailTitle(page)).toHaveText('Pons');
});

test('a missing model shows an error with a working retry', async ({ page }) => {
  let fail = true;
  await page.route('**/models/brain.glb', (route) => (fail ? route.fulfill({ status: 404, body: 'not found' }) : route.continue()));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('The 3D model could not be loaded');
  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await ready(page);
});

test('reduced motion: the inside view works without errors', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1366, height: 820 } });
  const page = await context.newPage();
  const errors = await open(page);
  await ready(page);
  await page.getByRole('button', { name: 'Inside', exact: true }).click();
  await settle(page, 800);
  expect(errors).toEqual([]);
  await context.close();
});
