import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/developer';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep authenticated areas out of the index.
      disallow: ['/dashboard', '/login'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
