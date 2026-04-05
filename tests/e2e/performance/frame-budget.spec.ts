import { test, expect } from '@playwright/test';

test.describe('Frame Budget & Rendering Latency', () => {

    test('should maintain acceptable FPS over normal load', async ({ page }) => {

        await page.goto('/dashboard');

        // Wait for dashboard to render and stream to start
        await expect(page.locator('text=TradeGrid')).toBeVisible();

        // Inject FPS measurement into the page
        await page.evaluate(() => {
            const w = window as any;
            w['__fpsLogs'] = [];
            let frames = 0;
            let lastTime = performance.now();

            const measure = () => {
                const now = performance.now();
                if (now - lastTime >= 1000) {
                    w['__fpsLogs'].push(frames);
                    frames = 0;
                    lastTime = now;
                }
                frames++;
                if (w['__fpsLogs'].length < 5) requestAnimationFrame(measure);
            };
            requestAnimationFrame(measure);
        });

        // Wait 6 seconds for measurement to complete
        await page.waitForTimeout(6000);

        const logs: number[] = await page.evaluate(() => (window as any)['__fpsLogs'] || []);

        // Ensure we got at least 5 seconds of data
        expect(logs.length).toBeGreaterThanOrEqual(5);

        // Average FPS should be well above 30 (headless CI can be slower)
        const average = logs.reduce((a, b) => a + b, 0) / logs.length;
        expect(average).toBeGreaterThan(30);
    });

    test('should not have long tasks blocking the main thread', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=TradeGrid')).toBeVisible();

        // Collect long task entries via Performance API
        const longTasks = await page.evaluate(() => {
            return new Promise<any[]>((resolve) => {
                const entries = performance.getEntriesByType('longtask') as any[];
                resolve(entries);
            });
        });

        // In a healthy app, there should be very few long tasks (>50ms)
        // In CI, some tolerance is needed
        expect(longTasks.length).toBeLessThan(10);
    });
});
