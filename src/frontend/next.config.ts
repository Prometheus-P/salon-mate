import type { NextConfig } from "next";

function buildRemotePatterns() {
  const rawDomains =
    process.env.NEXT_PUBLIC_IMAGE_DOMAINS?.split(',')
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  if (rawDomains.length === 0) {
    return [
      {
        protocol: 'https' as const,
        hostname: 'example.com',
        pathname: '/**',
      },
    ];
  }

  return rawDomains
    .map((domain) => {
      const normalized = domain.includes('://') ? domain : `https://${domain}`;
      try {
        const url = new URL(normalized);
        const pathname = url.pathname && url.pathname !== '/' ? `${url.pathname.replace(/\/$/, '')}/**` : '/**';
        const protocol = url.protocol.replace(':', '');
        if (protocol !== 'http' && protocol !== 'https') {
          return null;
        }
        return {
          protocol: protocol as 'http' | 'https',
          hostname: url.hostname,
          pathname,
        };
      } catch {
        console.warn(`Invalid domain supplied in NEXT_PUBLIC_IMAGE_DOMAINS: ${domain}`);
        return null;
      }
    })
    .filter((pattern): pattern is { protocol: 'http' | 'https'; hostname: string; pathname: string } => pattern !== null);
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: buildRemotePatterns(),
  },
};

export default nextConfig;
