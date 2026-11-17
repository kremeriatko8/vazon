import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration (Prisma 7+).
 * The connection string comes from DATABASE_URL: backend/.env for local runs,
 * or the environment set by docker-compose.yml inside the container.
 * `prisma generate` and `prisma validate` work without it; migrations need it.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
