import type { Metadata } from 'next';
import { SiteDocument, siteMetadata } from '../site-layout';

export { viewport } from '../site-layout';

export const metadata: Metadata = siteMetadata('en');

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument lang="en">{children}</SiteDocument>;
}
