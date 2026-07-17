export default () => ({
  port: parseInt(process.env.PORT ?? '7004', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongo: {
    uri: process.env.MONGO_URI ?? 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB_NAME ?? 'audit_logs',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'changeme',
  },

  cors: {
    origins: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [],
  },
  cookie: {
    secret: process.env.COOKIE_SECRET ?? 'changeme',
    sameSite: (process.env.COOKIE_SAMESITE ?? 'lax') as
      'lax' | 'strict' | 'none',
    expiration: parseInt(process.env.COOKIE_EXPIRATION ?? '86400000', 10),
  },

  apiKeys: process.env.API_KEYS?.split(',').map((k) => k.trim()) ?? [],
});
