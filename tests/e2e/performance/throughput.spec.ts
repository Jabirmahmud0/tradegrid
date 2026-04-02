import { test, expect } from '@playwright/test';

test.describe('Dashboard Performance & Throughput', () => {

    test.fixme('should maintain responsive UI under burst throughput mode', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Ensure connected
        await expect(page.locator('div[title*="Connected"]')).toBeVisible({ timeout: 10000 });
        
        // This test requires a backend hook to trigger the burst scenario
        // Maybe fetch('http://localhost:8080/scenario?mode=burst', { method: 'POST' })
        // For now, we simulate user setting changes or API calls.
        
        await page.evaluate(() => {
            fetch('http://localhost:4000/api/scenario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'burst' })
            }).catch(() => {});
        });

        // Wait a few seconds for queue to build and pipeline to stress out
        await page.waitForTimeout(3000);

        // Verify the interval UI element is still clickable (reacting within reasonable time)
        const btn5m = page.locator('button', { hasText: '5m' });
        await btn5m.click();
        await expect(btn5m).toHaveAttribute('data-state', 'active');
        
        // Revert to normal
        await page.evaluate(() => {
            fetch('http://localhost:4000/api/scenario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'normal' })
            }).catch(() => {});
        });
    });
});
