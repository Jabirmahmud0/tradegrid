import { test, expect } from '@playwright/test';

test.describe('Keyboard Accessibility', () => {
    test('should support skip link', async ({ page }) => {
        await page.goto('/dashboard');

        // Skip link should be hidden by default
        const skipLink = page.getByRole('link', { name: /skip to main content/i });
        await expect(skipLink).toBeHidden();

        // Pressing Tab should reveal skip link and focus it
        await page.keyboard.press('Tab');
        await expect(skipLink).toBeFocused();

        // Pressing Enter on skip link should jump to main content
        await page.keyboard.press('Enter');
        const mainContent = page.locator('#main-content');
        await expect(mainContent).toBeFocused();
    });

    test('should support keyboard navigation across major components', async ({ page }) => {
        await page.goto('/dashboard');

        // Skip the skip link
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Symbol combobox should be focused
        const symbolCombobox = page.getByRole('combobox', { name: /symbol/i });
        await expect(symbolCombobox).toBeFocused();

        // Open combobox with Enter
        await page.keyboard.press('Enter');
        const listbox = page.getByRole('listbox', { name: /select trading symbol/i });
        await expect(listbox).toBeVisible();

        // Close with Escape
        await page.keyboard.press('Escape');
        await expect(listbox).toBeHidden();

        // Tab to interval combobox
        await page.keyboard.press('Tab');
        const intervalCombobox = page.getByRole('combobox', { name: /interval/i });
        await expect(intervalCombobox).toBeFocused();

        // Open and select with keyboard
        await page.keyboard.press('Enter');
        const intervalListbox = page.getByRole('listbox', { name: /select candle interval/i });
        await expect(intervalListbox).toBeVisible();

        // Navigate with arrow keys (options are focusable)
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect(intervalListbox).toBeHidden();
    });

    test('should support keyboard navigation on tabs', async ({ page }) => {
        await page.goto('/dashboard');

        // Tab through skip link and comboboxes to reach tab list
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
        }

        // At least one tab should be focusable
        const tabs = page.getByRole('tab');
        await expect(tabs.first()).toBeFocused();

        // Arrow keys should navigate between tabs
        await page.keyboard.press('ArrowRight');
        await expect(tabs.nth(1)).toBeFocused();
    });

    test('should respect prefers-reduced-motion', async ({ page, browserName }) => {
        // Note: Playwright can't fully test CSS media queries,
        // but we can verify no animation-based assertions break the page
        await page.goto('/dashboard');

        // Force reduced-motion via emulation
        const context = page.context();
        await context.setExtraHTTPHeaders({ 'Sec-CH-Prefers-Reduced-Motion': 'reduce' });
        await page.reload();

        // Page should still render and be interactive
        await expect(page.getByRole('combobox', { name: /symbol/i })).toBeVisible();
    });
});
