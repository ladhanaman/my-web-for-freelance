export const MOOD_TAGS = [
  'lonely',
  'romantic',
  'hopeful',
  'grief',
  'restless',
  'soft',
  'dark',
  'nostalgic',
  'angry',
  'healing',
] as const

export const THEME_TAGS = [
  'love',
  'loss',
  'waiting',
  'memory',
  'distance',
  'self',
  'night',
  'belonging',
  'silence',
  'home',
] as const

export const TONE_TAGS = [
  'gentle',
  'intense',
  'raw',
  'dreamy',
  'melancholic',
  'warm',
] as const

export const POEM_LENGTHS = ['short', 'medium', 'long'] as const
export const NEXT_ACTIONS = ['ask_followup', 'recommend'] as const

export type MoodTag = (typeof MOOD_TAGS)[number]
export type ThemeTag = (typeof THEME_TAGS)[number]
export type ToneTag = (typeof TONE_TAGS)[number]
export type PoemLength = (typeof POEM_LENGTHS)[number]
export type NextAction = (typeof NEXT_ACTIONS)[number]

export interface Poem {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  moods: MoodTag[]
  themes: ThemeTag[]
  tones: ToneTag[]
  keywords: string[]
  length: PoemLength
  intensity: 1 | 2 | 3 | 4 | 5
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface ClientMetadata {
  userAgent?: string
  language?: string
  timezone?: string
  platform?: string
  viewportWidth?: number
  viewportHeight?: number
  screenWidth?: number
  screenHeight?: number
}

export interface IntentSnapshot {
  moods: MoodTag[]
  themes: ThemeTag[]
  tones: ToneTag[]
  keywords: string[]
  desiredLength?: PoemLength
  desiredIntensity?: 1 | 2 | 3 | 4 | 5
  confidence: number
  source: 'groq' | 'deterministic'
}

export interface RankedPoem {
  poem: Poem
  score: number
  reasons: string[]
}

export interface ParallaxChatRequest {
  sessionId: string
  message: string
  history: ChatMessage[]
  metadata: ClientMetadata
  excludedPoemIds?: string[]
}

export interface ParallaxChatResponse {
  reply: string
  intent: IntentSnapshot
  nextAction: NextAction
  matches: RankedPoem[]
  showLoader: boolean
  matchCycleId: string | null
}
