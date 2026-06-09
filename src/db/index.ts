import { PGlite } from '@electric-sql/pglite'
import { drizzle as drizzlePg } from 'drizzle-orm/pglite'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import type { PgliteDatabase } from 'drizzle-orm/pglite'
import * as schema from './schema'

type Schema = typeof schema
export type Db = PgliteDatabase<Schema> | NeonHttpDatabase<Schema>

let _db: Db | null = null

function createDb(): Db {
  if (process.env.VITEST) {
    const client = new PGlite()
    return drizzlePg(client, { schema }) as unknown as Db
  }
  const sql = neon(process.env.DATABASE_URL!)
  return drizzleNeon(sql, { schema }) as unknown as Db
}

export function getDb(): Db {
  if (!_db) {
    _db = createDb()
  }
  return _db
}

export { schema }
