import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parallaxSelectRequestSchema } from '@/lib/parallax/schema'

const SELECT_DB_TIMEOUT_MS = 5000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = parallaxSelectRequestSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 },
      )
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: true, persisted: false }, { status: 200 })
    }

    await Promise.race([
      prisma.parallaxMatchCycle.updateMany({
        where: {
          id: validated.data.matchCycleId,
          sessionId: validated.data.sessionId,
        },
        data: {
          selectedPoemId: validated.data.poemId,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Parallax select timeout')), SELECT_DB_TIMEOUT_MS),
      ),
    ])

    return NextResponse.json({ ok: true, persisted: true }, { status: 200 })
  } catch (error) {
    console.error('[parallax-select] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
