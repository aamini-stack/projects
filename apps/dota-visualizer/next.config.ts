import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Remove later.
  images: {
    remotePatterns: [
      new URL(
        'https://cdn.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/*.png',
      ),
    ],
  },
};

export default nextConfig;
