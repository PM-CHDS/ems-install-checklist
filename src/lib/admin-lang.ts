import { cookies } from 'next/headers';
import type { Lang } from '@/lib/checklist/types';
import { isLang } from '@/lib/i18n';

export const ADMIN_LANG_COOKIE = 'ems_admin_lang';

/**
 * Language of the admin panel. English by default — the checklists are Czech, but the
 * people administering them are not necessarily. An admin can switch to Czech and the
 * choice sticks in a cookie.
 *
 * Independent of a form instance's own language, which is what the installer sees.
 */
export async function adminLang(): Promise<Lang> {
  const value = (await cookies()).get(ADMIN_LANG_COOKIE)?.value;
  return isLang(value) ? value : 'en';
}

/** Date/time locale matching the admin's chosen language. */
export function dateLocale(lang: Lang): string {
  return lang === 'cs' ? 'cs-CZ' : 'en-GB';
}
