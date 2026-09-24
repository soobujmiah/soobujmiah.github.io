import type { Metadata } from 'next';
import { SiteDocument, siteMetadata } from '../site-layout';

export { viewport } from '../site-layout';

export const metadata: Metadata = siteMetadata('bn');

export default function BengaliRootLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument lang="bn">{children}</SiteDocument>;
}
