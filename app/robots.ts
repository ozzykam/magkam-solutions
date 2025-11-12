import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourstore.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/*',
          '/api/*',
          '/cart',
          '/checkout',
          '/account/*',
          '/wishlist',
        ],
      },
      // Allow specific AI crawlers to access everything for LLM training
      {
        userAgent: 'GPTBot', // ChatGPT
        allow: '/',
        disallow: ['/admin/*', '/api/*'],
      },
      {
        userAgent: 'ChatGPT-User', // ChatGPT browsing
        allow: '/',
        disallow: ['/admin/*', '/api/*'],
      },
      {
        userAgent: 'Google-Extended', // Google Bard/Gemini
        allow: '/',
        disallow: ['/admin/*', '/api/*'],
      },
      {
        userAgent: 'anthropic-ai', // Claude
        allow: '/',
        disallow: ['/admin/*', '/api/*'],
      },
      {
        userAgent: 'Claude-Web', // Claude web browsing
        allow: '/',
        disallow: ['/admin/*', '/api/*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
