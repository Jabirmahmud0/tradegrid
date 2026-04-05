import { test, expect } from '@playwright/test';

test.describe('Playback & Replay Controls', () => {
    test('should switch to replay mode and adjust playback speed', async ({ page }) => {
        await page.goto('/dashboard');

        // Wait for the dashboard to load
        await expect(page.locator('text=TradeGrid')).toBeVisible();

        // Navigate to Time Machine page where the full replay panel lives
        await page.getByRole('button', { name: 'Time Machine' }).click();
        await expect(page.locator('text=Time Machine')).toBeVisible({ timeout: 5000 });

        // Verify replay controls are rendered
        const playButton = page.locator('button[aria-label="Play"]');
        await expect(playButton).toBeVisible();

        // Speed buttons should be visible
        const speed10x = page.locator('button', { hasText: '10x' });
        await expect(speed10x).toBeVisible();

        // Click 10x speed
        await speed10x.click();

        // The slider should update
        const slider = page.locator('[role="slider"][aria-label="Replay progress"]');
        await expect(slider).toBeVisible();
    });

    test('should toggle between LIVE and REPLAY mode', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=TradeGrid')).toBeVisible();

        // The topbar has a mode toggle showing "LIVE" initially
        const liveIndicator = page.locator('text=LIVE');
        await expect(liveIndicator).toBeVisible();

        // Click to switch to REPLAY
        await liveIndicator.click();

        // Should now show REPLAY
        const replayIndicator = page.locator('text=REPLAY');
        await expect(replayIndicator).toBeVisible({ timeout: 5000 });

        // Switch back
        await replayIndicator.click();
        await expect(page.locator('text=LIVE')).toBeVisible({ timeout: 5000 });
    });
});
