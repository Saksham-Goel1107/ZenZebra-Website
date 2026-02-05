import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ZenZebra - Lifestyle Integration',
    short_name: 'ZenZebra',
    description: 'Curated lifestyle, seamlessly integrated into your daily life. Try it. Own it. On the go.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#CC2224',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/logo-2.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo-2.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
