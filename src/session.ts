/**
 * The admin session lives in sessionStorage: it ends when the tab closes, and
 * the API also ends it after its lifetime (8 hours by default). The app login
 * token is only kept while the staff member completes the authenticator step.
 */

const ADMIN_TOKEN = 'gigspot.admin.token';
const ADMIN_EXPIRES = 'gigspot.admin.expires';
const APP_TOKEN = 'gigspot.admin.signin';

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode): the session lasts until reload.
  }
}

export const session = {
  adminToken(): string | null {
    const token = read(ADMIN_TOKEN);
    const expires = Date.parse(read(ADMIN_EXPIRES) ?? '');
    if (!token || Number.isNaN(expires) || expires <= Date.now()) return null;
    return token;
  },
  setAdmin(token: string, expiresAt: string): void {
    write(ADMIN_TOKEN, token);
    write(ADMIN_EXPIRES, expiresAt);
    write(APP_TOKEN, null);
  },
  appToken(): string | null {
    return read(APP_TOKEN);
  },
  setApp(token: string | null): void {
    write(APP_TOKEN, token);
  },
  clear(): void {
    write(ADMIN_TOKEN, null);
    write(ADMIN_EXPIRES, null);
    write(APP_TOKEN, null);
  },
};
