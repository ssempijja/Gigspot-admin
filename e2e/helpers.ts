import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page } from '@playwright/test';
import { Secret, TOTP } from 'otpauth';

/** What e2e/start-api.mjs seeded: the shared demo password and one enrolment code per staff member. */
interface State {
  password: string;
  admin: { email: string; enrolment: string };
  viewer: { email: string; enrolment: string };
}

export function seeded(): State {
  return JSON.parse(readFileSync(join(import.meta.dirname, '.state', 'state.json'), 'utf8')) as State;
}

const codeFor = (secret: string) => new TOTP({ secret: Secret.fromBase32(secret), digits: 6, period: 30 }).generate();

/** First sign-in: account, enrolment code, read the key off the page, then a code from it. Returns the key. */
export async function enrolAndSignIn(page: Page, who: { email: string; enrolment: string }, password: string): Promise<string> {
  await page.goto('/login');
  await page.getByLabel('Phone number or email').fill(who.email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Enrolment code').fill(who.enrolment);
  await page.getByRole('button', { name: 'Continue' }).click();
  const secret = (await page.locator('.ant-typography code').first().innerText()).trim();
  expect(secret).toMatch(/^[A-Z2-7]{16,}$/);
  await page.getByRole('button', { name: "I've added it" }).click();
  await page.getByLabel('6-digit code from your authenticator app').fill(codeFor(secret));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  return secret;
}

/** The open action dialog (ActionButton's modal). */
export const dialog = (page: Page): Locator => page.locator('.ant-modal-content').filter({ hasText: 'Confirm' }).last();

/** Click an action button, give a reason, confirm, and wait for the dialog to close. */
export async function act(page: Page, button: string, reason: string, fill?: (modal: Locator) => Promise<void>): Promise<void> {
  await page.getByRole('button', { name: button, exact: true }).click();
  const modal = dialog(page);
  await expect(modal).toBeVisible();
  if (fill) await fill(modal);
  await modal.getByLabel('Reason (recorded in the audit log)').fill(reason);
  await modal.getByRole('button', { name: 'Confirm' }).click();
  await expect(modal).toBeHidden();
}

/** Pick [option] in the antd Select labelled [label] inside [scope]. */
export async function choose(page: Page, scope: Locator, label: string, option: string): Promise<void> {
  await scope.getByLabel(label).click();
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option').filter({ hasText: option }).first().click();
}
