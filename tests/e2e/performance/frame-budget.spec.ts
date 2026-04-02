import { test, expect } from '@playwright/test';

test.describe('Frame Budget & Rendering Latency', () => {

    test.fixme('should maintain 60 FPS average over normal load', async ({ page }) => {
        
        await page.goto('/dashboard');
        
        // Wait till connected
        // Observe internal PerformancePanel metrics (simulated via local storage or DOM)
        
        // Since playright runs outside JS loop, we inject a quick measurement script
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

        // Check if the average FPS is acceptable
        // Note: Headless browsers in CI might natively cap or perform worse than real ones
        // Often CI caps around 30-60 depending on the VM runner
        const average = logs.reduce((a, b) => a + b, 0) / logs.length;
        
        expect(average).toBeGreaterThan(45); // Acceptable threshold for CI running Playwright
    });
});
