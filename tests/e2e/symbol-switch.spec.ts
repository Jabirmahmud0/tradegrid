import { test, expect } from '@playwright/test';

test.describe('Instrument Switching', () => {
    test('should update all panels when changing the active symbol', async ({ page }) => {
        await page.goto('/dashboard');
        
        const combobox = page.locator('button[role="combobox"]');
        await expect(combobox).toBeVisible();
        await expect(combobox).toHaveText(/BTC-USD/); // Default symbol

        // Open selector
        await combobox.click();
        
        // Select ETH-USD
        const ethItem = page.locator('[role="option"]', { hasText: 'ETH-USD' });
        await expect(ethItem).toBeVisible();
        await ethItem.click();

        // Verify selector reflects new symbol
        await expect(combobox).toHaveText(/ETH-USD/);
        
        // Wait for Trade Tape and Order Book updates.
        // The TradeTape row components display the symbol, so we can check if it says ETH-USD instead of BTC-USD.
        // Depending on DOM structure, there's a symbol column.
        const firstTradeRow = page.locator('.col-span-12', { hasText: 'ETH-USD' }).first();
        await expect(firstTradeRow).toBeVisible({ timeout: 15000 });
        
        // Order Book should eventually show populated rows with the new price format (since ETH trades typically lower nominal price than BTC, or at least new flash highlighting).
        await expect(page.locator('text=Calibrating Order Flow')).not.toBeVisible();
    });
});
