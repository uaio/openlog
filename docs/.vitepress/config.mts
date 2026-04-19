import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'openLog',
  description: 'Mobile H5 Debugging Tool',
  base: '/openLog/',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/uaio/openLog' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Console Logs', link: '/guide/console' },
            { text: 'Network Requests', link: '/guide/network' },
            { text: 'Storage', link: '/guide/storage' },
            { text: 'Performance', link: '/guide/performance' },
            { text: 'Mock & Throttle', link: '/guide/mock' },
            { text: 'Health Checks', link: '/guide/health' },
            { text: 'MCP Integration', link: '/guide/mcp' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'SDK', link: '/api/sdk' },
            { text: 'CLI', link: '/api/cli' },
            { text: 'Server', link: '/api/server' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/uaio/openLog' }],
  },
});
