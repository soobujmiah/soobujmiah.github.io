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
    ...SECTION_IDS.map((_, i) => ({
      url: sectionUrl(i),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: i === 0 ? 1 : 0.7,
    })),
    /* The service-intent layer: hub + eight pages, outside the pager. */
    ...SERVICE_ROUTES.map((href, i) => ({
      url: new URL(href, SITE_ORIGIN).href,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: i === 0 ? 0.8 : 0.6,
    })),
  ];
}
