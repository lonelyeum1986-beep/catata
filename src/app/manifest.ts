import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Catata. — Personal Pocket Notebook',
    short_name: 'Catata.',
    description:
      'Buku saku digital offline-first untuk catatan harian, agenda mingguan, dan arsip ide pribadi.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF7EF',
    theme_color: '#8F7659',
    orientation: 'any',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}