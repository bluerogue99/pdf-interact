import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

export default {
    dialect: 'postgresql',  // Correcting to a valid driver type for PostgreSQL
    schema: './src/lib/db/schema.ts',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
} satisfies Config;