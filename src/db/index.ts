import { PGlite } from '@electric-sql/pglite'
import { drizzle as drizzlePg } from 'drizzle-orm/pglite'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

function createDb() {
  if (process.env.VITEST) {
    const client = new PGlite()
    return drizzlePg(client, { schema })
  }
  const sql = neon(process.env.DATABASE_URL!)
  return drizzleNeon(sql, { schema })
}

export const db = createDb()
export { schema }