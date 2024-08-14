import { neon, neonConfig } from '@neondatabase/serverless';
neonConfig.fetchConnectionCache = true;
import { drizzle } from 'drizzle-orm/neon-http';

if (!process.env.DATABASE_URL) {
    throw new Error('Database URL not found');
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql);



