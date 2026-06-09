import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { getDb } from '@/db'
import * as schema from '@/db/schema'

export async function requireUser() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return { userId }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function syncUser(userId: string) {
  const { users } = schema

  const existing = await getDb()
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1)

  if (existing.length > 0) {
    return existing[0]
  }

  const [user] = await getDb()
    .insert(users)
    .values({ clerkId: userId })
    .returning()

  return user
}

export async function validateModelProvider(
  db: ReturnType<typeof getDb>,
  modelId: number,
  providerId: number,
): Promise<boolean> {
  const { models } = schema

  const result = await db
    .select()
    .from(models)
    .where(
      and(
        eq(models.id, modelId),
        eq(models.providerId, providerId),
      ),
    )
    .limit(1)

  return result.length > 0
}
