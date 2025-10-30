import { test, expect } from '@playwright/test';

test.describe('Client history status insights', () => {
  test('renders stats bars and filters by resolved status', async ({ page }) => {
    await page.goto('/client-history.html');

    const reportCards = page.locator('.report-card');
    await expect(reportCards.first()).toBeVisible();

    const statsPanel = page.locator('#historyStatsPanel');
    await expect(statsPanel).toBeVisible();

    const statsTotal = page.getByTestId('history-stats-total');
    await expect(statsTotal).toHaveText('5');

    await page.getByTestId('status-filter').selectOption('resolved');

    await expect(reportCards).toHaveCount(1);
    await expect(reportCards.first().locator('.status-badge')).toHaveText(/Resolved/i);

    await expect(statsTotal).toHaveText('1');
    await expect(page.getByTestId('history-status-row')).toHaveCount(1);
    await expect(page.getByTestId('history-status-row').first()).toContainText('Resolved');
    await expect(page.getByTestId('history-highlight').filter({ hasText: 'Resolved' })).toBeVisible();
  });

  test('hides stats when no reports match filters', async ({ page }) => {
    await page.goto('/client-history.html');
    const statsPanel = page.locator('#historyStatsPanel');
    await expect(statsPanel).toBeVisible();

    await page.fill('#searchQuery', 'no-matching-customer-query');
    await page.click('button[type="submit"]');

    const emptyState = page.locator('.empty-state');
    await expect(emptyState).toBeVisible();
    await expect(statsPanel).toBeHidden();
    await expect(page.getByTestId('history-stats-total')).toHaveCount(0);
  });
});
