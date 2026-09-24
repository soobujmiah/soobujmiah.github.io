import type { MetadataRoute } from 'next';
import { SECTION_IDS, sectionUrl } from './sections';
import { SERVICE_ROUTES } from './services';
import { SITE_ORIGIN } from './sections';

export const dynamic = 'force-static';

/* One line per real section route — the pager's pages are now
   individually addressable and individually indexable. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    ...SECTION_IDS.flatMap((_, i) => {
      const en = sectionUrl(i, 'en');
      const bn = sectionUrl(i, 'bn');
      const priority = i === 0 ? 1 : 0.7;
      return [
        { url: en, lastModified, changeFrequency: 'monthly' as const, priority, alternates: { languages: { en, bn, 'x-default': en } } },
        { url: bn, lastModified, changeFrequency: 'monthly' as const, priority, alternates: { languages: { en, bn, 'x-default': en } } },
      ];
    }),
    /* The service-intent layer: hub + eight pages, outside the pager. */
    ...SERVICE_ROUTES.flatMap((href, i) => {
      const en = new URL(href, SITE_ORIGIN).href;
      const bn = new URL(`/bn${href}`, SITE_ORIGIN).href;
      const priority = i === 0 ? 0.8 : 0.6;
      return [
        { url: en, lastModified, changeFrequency: 'monthly' as const, priority, alternates: { languages: { en, bn, 'x-default': en } } },
        { url: bn, lastModified, changeFrequency: 'monthly' as const, priority, alternates: { languages: { en, bn, 'x-default': en } } },
      ];
    }),
  ];
}
