import { test, expect } from '@playwright/test';

test.describe('TradeGrid Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the local dev server
    await page.goto('http://localhost:5173');
  });

  test('should render the main chart and symbols', async ({ page }) => {
    // Check if the dashboard title exists
    await expect(page.locator('text=TradeGrid')).toBeVisible();

    // Check if the SymbolSelector is visible
    const symbolSelector = page.locator('button:has-text("BTCUSDT"), button:has-text("ETHUSDT")');
    await expect(symbolSelector.first()).toBeVisible();
  });

  test('should switch between tabs using keyboard shortcuts', async ({ page }) => {
    // Press 'H' for Heatmap
    await page.keyboard.press('h');
    await expect(page.locator('text=Liquidity Heatmap')).toHaveAttribute('data-state', 'active');

    // Press 'D' for Depth Map
    await page.keyboard.press('d');
    await expect(page.locator('text=Depth Map')).toHaveAttribute('data-state', 'active');
  });

  test('should enter replay mode and show controls', async ({ page }) => {
    // Replay controls are usually hidden until mode is REPLAY
    // Click the mode toggle in ReplayControls
    const modeToggle = page.locator('button:has-text("LIVE")');
    await modeToggle.click();

    // Verify it switched to REPLAY
    await expect(page.locator('text=REPLAY')).toBeVisible();

    // Verify media controls (Play/Pause) are visible
    await expect(page.locator('button:has-text("")').filter({ has: page.locator('svg') })).toBeVisible();
  });
});
