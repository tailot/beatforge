const { test, expect } = require('@playwright/test');

test.describe('BeatForge Genre Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
  });

  test('should select and play Classical genre', async ({ page }) => {
    await page.selectOption('#genre-sel', 'classical');
    await expect(page.locator('#genre-display')).toHaveText('classical');
    await expect(page.locator('#bpm-spinner')).toHaveValue('70');

    await page.click('#play-btn');
    await expect(page.locator('#play-btn')).toHaveText('■ Stop');

    // Wait for some notes to be generated
    await page.waitForTimeout(2000);
    const notes = await page.locator('#stat-notes').textContent();
    expect(parseInt(notes)).toBeGreaterThan(0);

    await page.screenshot({ path: 'screenshots/classical.png' });
  });

  test('should select and play Rock genre', async ({ page }) => {
    await page.selectOption('#genre-sel', 'rock');
    await expect(page.locator('#genre-display')).toHaveText('rock');
    await expect(page.locator('#bpm-spinner')).toHaveValue('110');

    await page.click('#play-btn');
    await expect(page.locator('#play-btn')).toHaveText('■ Stop');

    await page.waitForTimeout(2000);
    const notes = await page.locator('#stat-notes').textContent();
    expect(parseInt(notes)).toBeGreaterThan(0);

    await page.screenshot({ path: 'screenshots/rock.png' });
  });

  test('existing techno genre should still work', async ({ page }) => {
    await page.selectOption('#genre-sel', 'techno');
    await expect(page.locator('#genre-display')).toHaveText('techno');
    await expect(page.locator('#bpm-spinner')).toHaveValue('130');

    await page.click('#play-btn');
    await page.waitForTimeout(2000);
    const notes = await page.locator('#stat-notes').textContent();
    expect(parseInt(notes)).toBeGreaterThan(0);

    await page.screenshot({ path: 'screenshots/techno.png' });
  });
});
