import type { Metadata } from 'next';
import { Pager } from '@/components/Pager';
import { homeMetadata } from '@/app/route-seo';

export const metadata: Metadata = homeMetadata('bn');

export default function BengaliHome() {
  return <Pager initialIndex={0} initialLang="bn" />;
}
