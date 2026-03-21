const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
      ],
    },
  ],
}
export default nextConfig
