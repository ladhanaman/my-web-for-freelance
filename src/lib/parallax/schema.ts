import { z } from 'zod'
import { MOOD_TAGS, NEXT_ACTIONS, POEM_LENGTHS, THEME_TAGS, TONE_TAGS } from './types'

export const chatMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2000),
  createdAt: z.string().min(1),
})

export const clientMetadataSchema = z.object({
  userAgent: z.string().max(1000).optional(),
  language: z.string().max(32).optional(),
  timezone: z.string().max(100).optional(),
  platform: z.string().max(120).optional(),
  viewportWidth: z.number().int().positive().max(10000).optional(),
  viewportHeight: z.number().int().positive().max(10000).optional(),
  screenWidth: z.number().int().positive().max(10000).optional(),
  screenHeight: z.number().int().positive().max(10000).optional(),
})

export const parallaxChatRequestSchema = z.object({
  sessionId: z.string().trim().min(8).max(128),
  message: z.string().trim().min(1).max(1000),
  history: z.array(chatMessageSchema).max(20),
  metadata: clientMetadataSchema,
  excludedPoemIds: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
})

export const parallaxSelectRequestSchema = z.object({
  sessionId: z.string().trim().min(8).max(128),
  matchCycleId: z.string().trim().min(1).max(64),
  poemId: z.string().trim().min(1).max(100),
})

export const intentSnapshotSchema = z.object({
  moods: z.array(z.enum(MOOD_TAGS)),
  themes: z.array(z.enum(THEME_TAGS)),
  tones: z.array(z.enum(TONE_TAGS)),
  keywords: z.array(z.string()),
  desiredLength: z.enum(POEM_LENGTHS).optional(),
  desiredIntensity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  confidence: z.number().min(0).max(1),
  source: z.enum(['groq', 'deterministic']),
})

export const nextActionSchema = z.enum(NEXT_ACTIONS)
