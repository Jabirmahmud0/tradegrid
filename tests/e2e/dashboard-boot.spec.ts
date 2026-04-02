import { test, expect } from '@playwright/test';

test.describe('Dashboard Boot & Data Streaming', () => {
  test('should load the dashboard and establish WebSocket connection', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if Topbar is rendered with symbols
    await expect(page.locator('text=TradeGrid')).toBeVisible();
    
    // Check if the symbol selector is present and populated
    const symbolSelectorWrapper = page.locator('button[role="combobox"]');
    await expect(symbolSelectorWrapper).toBeVisible();

    // Verify Candlestick Chart canvas exists
    const chartCanvas = page.locator('.chart-canvas');
    await expect(chartCanvas).toHaveCount(2); // Wait, this depends on class names. We should just check standard UI elements first.

    // Verify order book headers
    await expect(page.locator('text=Price')).toBeVisible();
    await expect(page.locator('text=Size')).toBeVisible();

    // The stream should connect and eventually show "Connected" or a green dot.
    // In our UI, we use StatusIndicator. We can look for the title or similar text.
    const statusIndicator = page.locator('div[title*="Connected"]');
    await expect(statusIndicator).toBeVisible({ timeout: 10000 });
  });

  test('should display live trades after connection', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for the mock data to stream into the Trade Tape.
    // We can verify this by checking if there are multiple rows with tabular-nums
    // or specifically looking for the tape header and content.
    await expect(page.locator('text=Time')).toBeVisible();
    
    // We expect some trade rows to appear in the tape body
    // The TradeTape has a div with "text-right tabular-nums". Let's wait for at least one price.
    await expect(page.locator('.tabular-nums').first()).toBeVisible({ timeout: 15000 });
  });
});
