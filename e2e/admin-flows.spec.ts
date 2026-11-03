import { expect, test, type Page } from '@playwright/test';

import { act, choose, dialog, enrolAndSignIn, seeded } from './helpers';

/**
 * The key admin flows, in order, as one super admin on the demo data:
 * sign in with an authenticator, settle money, moderate content, message
 * people, and find all of it in the audit log.
 */
test.describe.serial('super admin', () => {
  let page: Page;
  const state = seeded();

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });
  test.afterAll(async () => {
    await page.close();
  });

  test('signs in for the first time with an enrolment code and an authenticator', async () => {
    await enrolAndSignIn(page, state.admin, state.password);
    await expect(page.locator('.gs-header').getByText('Dev Admin')).toBeVisible();
    await expect(page.getByText('Waiting for staff')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open disputes' })).toBeVisible();
  });

  test('marks a waiting withdrawal paid from the dashboard queue', async () => {
    await page.getByRole('link', { name: 'Withdrawals to settle' }).click();
    await expect(page).toHaveURL(/\/withdrawals$/);
    await page.getByRole('row').filter({ hasText: 'UGX 50,000' }).click();
    await expect(page.getByText('School fees')).toBeVisible();
    await act(page, 'Mark paid', 'Sent by hand from the office line');
    await expect(page.locator('.ant-tag').filter({ hasText: /^processed$/ })).toBeVisible();
    await expect(page.getByText('Sent by hand from the office line')).toBeVisible();
  });

  test('refuses to settle an unconfirmed transfer until Flutterwave was checked', async () => {
    await page.goto('/withdrawals?status=approved');
    await page.getByRole('row').filter({ hasText: 'UGX 30,000' }).click();
    await expect(page.getByText('A transfer was attempted but Flutterwave never confirmed it')).toBeVisible();

    await page.getByRole('button', { name: 'Reject', exact: true }).click();
    const modal = dialog(page);
    await modal.getByLabel('Reason (recorded in the audit log)').fill('Wrong account number');
    await modal.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText(/may have started\. Check it in Flutterwave/)).toBeVisible();

    await modal.getByText(/I checked Flutterwave for transfer/).click();
    await modal.getByRole('button', { name: 'Confirm' }).click();
    await expect(modal).toBeHidden();
    await expect(page.locator('.ant-tag').filter({ hasText: /^rejected$/ })).toBeVisible();
  });

  test('holds a payout and lifts the hold', async () => {
    await page.goto('/bookings');
    await page.getByRole('row').filter({ hasText: 'Rewire the shop' }).click();
    await act(page, 'Hold payout', 'Client called about the wiring');
    await expect(page.getByText('payout on hold')).toBeVisible();
    await act(page, 'Lift hold', 'Client confirmed it works');
    await expect(page.getByText('payout on hold')).toBeHidden();
  });

  test('resolves a review report and hides the review', async () => {
    await page.goto('/review-reports?status=pending');
    await page.getByRole('button', { name: 'Settle' }).click();
    const modal = dialog(page);
    await choose(page, modal, 'Outcome', 'Resolve: the report was right');
    await modal.getByText('Also hide the review').click();
    await modal.getByLabel('Reason (recorded in the audit log)').fill('Advertises another electrician');
    await modal.getByRole('button', { name: 'Confirm' }).click();
    await expect(modal).toBeHidden();
    await page.goto('/reviews?hidden=true');
    await expect(page.getByText('Late and left a mess')).toBeVisible();
  });

  test('edits a phone number out of a gig', async () => {
    await page.goto('/postings');
    await page.getByRole('row').filter({ hasText: 'Fix sockets in two bedrooms' }).click();
    await act(page, 'Edit wording', 'Phone numbers are not allowed in postings', async (modal) => {
      await modal.getByLabel('Description').fill('Two sockets spark when plugged in.');
    });
    await expect(page.getByText('0772 111 222')).toBeHidden();
    await expect(page.getByText('Two sockets spark when plugged in.')).toBeVisible();
  });

  test('adds a category and deletes it while unused', async () => {
    await page.goto('/categories');
    await act(page, 'New category', 'New trade on the platform', async (modal) => {
      await modal.getByLabel('Name', { exact: true }).fill('Painting');
      await modal.getByLabel('Icon name used by the app (e.g. water, bolt)').fill('brush');
    });
    const row = page.getByRole('row').filter({ hasText: 'Painting' });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Delete' }).click();
    const modal = dialog(page);
    await modal.getByLabel('Reason (recorded in the audit log)').fill('Added by mistake');
    await modal.getByRole('button', { name: 'Confirm' }).click();
    await expect(row).toBeHidden();
  });

  test('sends a notification to a group after confirming the head count', async () => {
    await page.goto('/notifications/send');
    await page.getByLabel('City (optional)').fill('Gulu');
    await page.getByLabel('Title', { exact: true }).fill('Water outage');
    await page.getByLabel('Message', { exact: true }).fill('Expect low pressure on Saturday morning.');
    await page.getByRole('button', { name: 'Count recipients and send' }).click();
    // Brian (client) and Sarah (professional) live in Gulu.
    await page.getByRole('button', { name: 'Send to 2' }).click();
    await expect(page.getByText('Sent to 2 people.')).toBeVisible();
    await page.goto('/notifications/sent');
    await expect(page.getByRole('row').filter({ hasText: 'Water outage' })).toContainText('city: Gulu');
  });

  test('finds every action above in the audit log, with its reason', async () => {
    await page.goto('/audit-log');
    for (const [action, reason] of [
      ['withdrawal.marked_paid', 'Sent by hand from the office line'],
      ['withdrawal.rejected', 'Wrong account number'],
      ['payout.held', 'Client called about the wiring'],
      ['review_report.resolved', 'Advertises another electrician'],
      ['posting.edited', 'Phone numbers are not allowed in postings'],
      ['category.deleted', 'Added by mistake'],
    ]) {
      await expect(page.getByRole('row').filter({ hasText: action }).filter({ hasText: reason })).toBeVisible();
    }
    await expect(page.getByRole('row').filter({ hasText: 'notification.sent' })).toBeVisible();
  });

  test('signs out', async () => {
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login(\?|$)/);
    // The admin session is gone: a protected page sends you back to sign in.
    await page.goto('/withdrawals');
    await expect(page).toHaveURL(/\/login\?to=%2Fwithdrawals$/);
  });
});

test.describe('viewer', () => {
  test('sees records but no actions, and no staff screens', async ({ page }) => {
    const state = seeded();
    await enrolAndSignIn(page, state.viewer, state.password);
    await expect(page.getByRole('menuitem', { name: /Staff/ })).toHaveCount(0);

    await page.goto('/withdrawals');
    await page.getByRole('row').filter({ hasText: 'UGX 50,000' }).click();
    await expect(page.getByText('Withdrawal #')).toBeVisible();
    // Account numbers are masked for roles that don't pay withdrawals.
    await expect(page.getByText(/\*{4,}0123/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark paid' })).toHaveCount(0);

    await page.goto('/plans');
    await expect(page.getByText('Pro Monthly')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);

    // Typing an admin-only address shows the API's refusal, not the page.
    await page.goto('/staff');
    await expect(page.getByText(/Your role does not allow this/)).toBeVisible();
  });
});
