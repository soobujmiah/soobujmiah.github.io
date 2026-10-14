import type { Metadata } from 'next';
import { Journey } from '@/components/Journey';
import { homeMetadata } from '@/app/route-seo';

export const metadata: Metadata = homeMetadata('bn');

export default function BengaliHome() {
  return <Journey initialIndex={0} initialLang="bn" />;
}
