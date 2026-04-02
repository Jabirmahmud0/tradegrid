import { test, expect } from '@playwright/test';

test.describe('Keyboard Accessibility', () => {
    test('should support keyboard navigation across major components', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Wait for page load
        await expect(page.locator('text=TradeGrid')).toBeVisible();

        // 1. Press Tab: Focus on Symbol Selector (combobox)
        await page.keyboard.press('Tab');
        const combobox = page.locator('button[role="combobox"]');
        await expect(combobox).toBeFocused();

        // Open combobox with Enter, then Escape
        await page.keyboard.press('Enter');
        const popup = page.locator('[role="listbox"]');
        await expect(popup).toBeVisible();
        await page.keyboard.press('Escape');

        // 2. Press Tab: Navigate to Interval selector (Radio Group / Tabs)
        await page.keyboard.press('Tab');
        const firstTab = page.locator('[role="tab"], button[data-state]').first();
        await expect(firstTab).toBeFocused();
    });
});
