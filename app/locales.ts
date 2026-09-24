import type { Lang } from './content';

export const BENGALI_PREFIX = '/bn';

export function localizedPath(pathname: string, lang: Lang): string {
  const path = pathname || '/';
  const englishPath = path.replace(/^\/bn(?=\/|$)/, '') || '/';
  if (lang === 'en') return englishPath.startsWith('/') ? englishPath : `/${englishPath}`;
  if (englishPath === '/') return '/bn/';
  return `/bn${englishPath.startsWith('/') ? englishPath : `/${englishPath}`}`;
}
