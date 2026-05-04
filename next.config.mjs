import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  cacheStartUrl: true,
  reloadOnOnline: true,
  customWorkerSrc: "public/sw-custom.js",
  fallbacks: {
    // Serve the offline page when a navigation request fails both network and cache
    document: "/~offline",
  },
  workboxOptions: {
    // Exclude middleware manifest, source maps, and marker-icon (avoids
    // duplicate-revision precache conflict from leaflet's static import)
    exclude: [/middleware-manifest\.json$/, /\.map$/, /marker-icon.*\.png$/],
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      // ── Branding assets (logos) — CacheFirst, long TTL ──
      {
        urlPattern: /\/branding\/.*\.(?:svg|png|webp|jpg|jpeg)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "branding-assets",
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      // ── Icon assets — CacheFirst, long TTL ──
      {
        urlPattern: /\/icons\/.*\.(?:png|svg|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "icon-assets",
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      // ── Field Guide species images — CacheFirst, 30-day TTL ──
      // Species images rarely change and must be available offline for field use.
      // Matches /images/species/*, /field-guide/images/*, and /_next/image
      // requests whose source URL contains "species".
      {
        urlPattern:
          /(?:\/images\/species\/|\/field-guide\/images\/).*\.(?:jpg|jpeg|png|webp|svg|gif|avif)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "field-guide-species-images",
          expiration: {
            maxEntries: 500,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ── Field Guide species images via Next.js Image Optimization ──
      // Catches /_next/image?url=…species… so optimized species images
      // are also cached with CacheFirst for reliable offline access.
      {
        urlPattern: /\/_next\/image\?url=.*species.*$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "field-guide-species-images",
          expiration: {
            maxEntries: 500,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ── Google Fonts webfonts — CacheFirst, 1 year ──
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: {
            maxEntries: 8,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      // ── Google Fonts stylesheets — StaleWhileRevalidate ──
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "google-fonts-stylesheets",
          expiration: {
            maxEntries: 8,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      // ── Local font files — StaleWhileRevalidate ──
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font\.css)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-font-assets",
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      // ── Next.js static JS bundles — CacheFirst (hashed filenames) ──
      {
        urlPattern: /\/_next\/static.+\.js$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static-js-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // ── Static CSS — StaleWhileRevalidate ──
      {
        urlPattern: /\.(?:css|less)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-style-assets",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // ── Static images (general) — StaleWhileRevalidate ──
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-image-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      // ── Next.js optimized images — StaleWhileRevalidate ──
      {
        urlPattern: /\/_next\/image\?url=.+$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-image",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // ── Other static JS — StaleWhileRevalidate ──
      {
        urlPattern: /\.(?:js)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-js-assets",
          expiration: {
            maxEntries: 48,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // ── Next.js data routes — StaleWhileRevalidate ──
      {
        urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-data",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // ── Static data files — NetworkFirst ──
      {
        urlPattern: /\.(?:json|xml|csv)$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "static-data-assets",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // ── API routes (skip auth callbacks) — NetworkFirst ──
      {
        urlPattern: ({ sameOrigin, url: { pathname } }) =>
          sameOrigin &&
          pathname.startsWith("/api/") &&
          !pathname.startsWith("/api/auth/callback"),
        handler: "NetworkFirst",
        method: "GET",
        options: {
          cacheName: "apis",
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
          networkTimeoutSeconds: 10,
        },
      },
      // ── RSC prefetch — NetworkFirst ──
      {
        urlPattern: ({ request, url: { pathname }, sameOrigin }) =>
          request.headers.get("RSC") === "1" &&
          request.headers.get("Next-Router-Prefetch") === "1" &&
          sameOrigin &&
          !pathname.startsWith("/api/"),
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-rsc-prefetch",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // ── RSC navigation — NetworkFirst ──
      {
        urlPattern: ({ request, url: { pathname }, sameOrigin }) =>
          request.headers.get("RSC") === "1" &&
          sameOrigin &&
          !pathname.startsWith("/api/"),
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-rsc",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // ── Same-origin pages — NetworkFirst ──
      {
        urlPattern: ({ url: { pathname }, sameOrigin }) =>
          sameOrigin && !pathname.startsWith("/api/"),
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // ── Map tiles (OpenStreetMap + common tile CDNs) — StaleWhileRevalidate ──
      // Tiles are cached for offline map viewing of previously browsed areas.
      // StaleWhileRevalidate serves cached tiles instantly while fetching
      // updates in the background — ideal for map tiles that change infrequently.
      {
        urlPattern:
          /^https:\/\/[a-c]?\.?tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "map-tiles-osm",
          expiration: {
            maxEntries: 2000,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ── Map tiles from other common tile providers ──
      // Covers Carto, Stamen/Stadia, Thunderforest, MapTiler, and similar
      // tile CDNs that serve z/x/y tile images.
      {
        urlPattern:
          /^https:\/\/.*(?:basemaps\.cartocdn\.com|tiles\.stadiamaps\.com|tile\.thunderforest\.com|api\.maptiler\.com|mt\d?\.google\.com)\/.*\/\d+\/\d+\/\d+.*\.(?:png|jpg|jpeg|webp|pbf)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "map-tiles-cdn",
          expiration: {
            maxEntries: 2000,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ── Cross-origin — NetworkFirst with timeout ──
      {
        urlPattern: ({ sameOrigin }) => !sameOrigin,
        handler: "NetworkFirst",
        options: {
          cacheName: "cross-origin",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/wikipedia/commons/**',
      },
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
        pathname: '/wiki/Special:FilePath/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
