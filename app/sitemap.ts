import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://brainypulse.com'

  const routes = [
    { path: '',               priority: 1.0,  freq: 'daily'   },
    { path: '/typing-test',   priority: 0.9,  freq: 'weekly'  },
    { path: '/memory-test',   priority: 0.9,  freq: 'weekly'  },
    { path: '/maths-test',    priority: 0.9,  freq: 'weekly'  },
    { path: '/reaction-test', priority: 0.9,  freq: 'weekly'  },
    { path: '/daily',         priority: 0.85, freq: 'daily'   },
    { path: '/leaderboard',   priority: 0.8,  freq: 'daily'   },
    { path: '/auth/login',    priority: 0.5,  freq: 'monthly' },
    { path: '/auth/signup',   priority: 0.5,  freq: 'monthly' },
  ]

  return routes.map(({ path, priority, freq }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date().toISOString(),
    changeFrequency: freq as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority,
  }))
}
