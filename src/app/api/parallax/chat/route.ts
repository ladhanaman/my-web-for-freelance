import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { handleParallaxChatTurn } from '@/lib/parallax/orchestrator'
import { parallaxChatRequestSchema } from '@/lib/parallax/schema'

// Simple in-memory rate limiter: 10 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

async function persistChatTurn(input: {
  sessionId: string
  metadata: {
    userAgent?: string
    language?: string
    timezone?: string
    platform?: string
    viewportWidth?: number
    viewportHeight?: number
    screenWidth?: number
    screenHeight?: number
  }
  message: string
  reply: string
  nextAction: string
  intent: unknown
  matchedPoemIds: string[]
}) {
  if (!process.env.DATABASE_URL) {
    return null
  }

  return prisma.$transaction(async tx => {
    await tx.parallaxSession.upsert({
      where: { id: input.sessionId },
      create: {
        id: input.sessionId,
        ...input.metadata,
      },
      update: {
        ...input.metadata,
      },
    })

    let matchCycleId: string | null = null

    if (input.matchedPoemIds.length > 0) {
      const cycle = await tx.parallaxMatchCycle.create({
        data: {
          sessionId: input.sessionId,
          promptMessage: input.message,
          assistantReply: input.reply,
          rankedPoemIds: input.matchedPoemIds,
        },
      })

      matchCycleId = cycle.id
    }

    await tx.parallaxChatTurn.create({
      data: {
        sessionId: input.sessionId,
        matchCycleId,
        userMessage: input.message,
        assistantReply: input.reply,
        nextAction: input.nextAction,
        intent: JSON.parse(JSON.stringify(input.intent)),
      },
    })

    return matchCycleId
  })
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const validated = parallaxChatRequestSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 },
      )
    }

    const result = await handleParallaxChatTurn(validated.data)

    // Fire-and-forget: don't block the response on DB persistence
    persistChatTurn({
      sessionId: validated.data.sessionId,
      metadata: validated.data.metadata,
      message: validated.data.message,
      reply: result.reply,
      nextAction: result.nextAction,
      intent: result.intent,
      matchedPoemIds: result.matches.map(match => match.poem.id),
    }).catch(error => {
      console.error('[parallax-chat] persistence error:', error)
    })

    return NextResponse.json(
      {
        ...result,
        matchCycleId: null,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[parallax-chat] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
