import { test, expect } from '@playwright/test';

test.describe('TradeGrid Dashboard Rendering & Performance', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for symbols to load
        await page.waitForSelector('button:has-text("BTC-USD")');
    });

    test('should render high-performance canvas components', async ({ page }) => {
        // Main Candlestick Chart (Canvas inside)
        const candlestickCanvas = page.locator('canvas').nth(0);
        await expect(candlestickCanvas).toBeVisible();

        // Check if secondary chart tabs work and render canvases
        // Switch to Heatmap
        await page.keyboard.press('h');
        const heatmapCanvas = page.locator('canvas').filter({ hasText: '' }).last();
        await expect(heatmapCanvas).toBeVisible();

        // Switch to Depth Map
        await page.keyboard.press('d');
        const depthCanvas = page.locator('canvas').filter({ hasText: '' }).last();
        await expect(depthCanvas).toBeVisible();
    });

    test('should show tooltip on heatmap hover', async ({ page }) => {
        await page.keyboard.press('h');
        const heatmap = page.locator('div:has(canvas)').last();
        
        // Hover center of heatmap
        const box = await heatmap.boundingBox();
        if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            // Verify tooltip appears
            await expect(page.locator('div:has-text("VOL:")')).toBeVisible();
        }
    });

    test('should virtualize Trade Tape and Order Book', async ({ page }) => {
        // Trade Tape presence
        await expect(page.locator('text=Trade Tape')).toBeVisible();
        const trades = page.locator('div[role="row"]'); // Assuming rows have role="row" from virtualizer
        // Should have many items but not thousands in DOM
        const count = await trades.count();
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThan(100); // Virtualization check
        
        // Order Book
        await expect(page.locator('text=Price').first()).toBeVisible();
    });

    test('should manage replay mode state transition', async ({ page }) => {
        // Click LIVE to switch to REPLAY
        const liveBtn = page.locator('button:has-text("LIVE")');
        await liveBtn.click();

        // Verify Replay Panel appears (floating bottom)
        await expect(page.locator('text=Exit Replay Mode')).toBeVisible();
        await expect(page.locator('text=FPS:')).toBeVisible();
        
        // Pause/Play
        const pauseBtn = page.locator('button:has(svg)'); // Multiple SVG buttons, but we can target the round one
        const playBtn = page.locator('button:has(svg[data-lucide="play"])');
        
        // Click Pause (default is playing)
        await page.locator('button:has(svg[data-lucide="pause"])').click();
        await expect(page.locator('svg[data-lucide="play"]')).toBeVisible();
    });
});
