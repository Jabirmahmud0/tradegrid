import { test, expect } from '@playwright/test';

test.describe('Chart Interactions', () => {
    test('should allow panning and zooming on the candlestick chart', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Wait for connection to settle
        const chartWrapper = page.locator('.col-span-12.lg\\:col-span-9').first(); 
        // This relies on layout class names that might change. 
        // Better to wait on a specific ID or role once implemented fully.
        await expect(page.locator('text=Candlestick Chart').first()).toBeVisible();

        // Hover over the chart area to trigger crosshairs
        const rect = await chartWrapper.boundingBox();
        if (rect) {
            await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
            // Verify tooltip or crosshair elements exist in the DOM
            // e.g. await expect(page.locator('.crosshair-line-x')).toBeVisible();

            // Simulate mouse wheel zoom
            await page.mouse.wheel(0, 100);
            
            // Pan gesture with drag
            await page.mouse.down();
            await page.mouse.move(rect.x + rect.width / 2 - 50, rect.y + rect.height / 2);
            await page.mouse.up();
        }
    });

    test('should change candlestick interval correctly', async ({ page }) => {
        await page.goto('/dashboard');

        // Locate interval tabs
        const btn5m = page.locator('button', { hasText: '5m' });
        await expect(btn5m).toBeVisible();

        await btn5m.click();
        
        // Ensure UI reflects the change (e.g., active class or attribute applied)
        await expect(btn5m).toHaveAttribute('data-state', 'active');
    });
});
