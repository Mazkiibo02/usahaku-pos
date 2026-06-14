import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/pos', '/dashboard', '/api'],
    },
    sitemap: 'https://usahakupos.my.id/sitemap.xml',
  };
}
