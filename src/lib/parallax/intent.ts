import { buildGroqIntentPrompt } from './prompts'
import type {
  ChatMessage,
  IntentSnapshot,
  MoodTag,
  PoemLength,
  ThemeTag,
  ToneTag,
} from './types'
import { MOOD_TAGS, POEM_LENGTHS, THEME_TAGS, TONE_TAGS } from './types'

const MOOD_KEYWORDS: Record<MoodTag, string[]> = {
  lonely: ['alone', 'lonely', 'empty', 'missing', 'miss someone', 'longing'],
  romantic: ['love', 'romantic', 'crush', 'lover', 'heart', 'longing'],
  hopeful: ['hope', 'hopeful', 'light', 'better', 'heal', 'forward'],
  grief: ['grief', 'mourning', 'broken', 'hurts', 'loss'],
  restless: ['restless', 'anxious', 'spiral', 'overthinking', 'unsettled', 'thoughts'],
  soft: ['soft', 'gentle', 'quiet', 'calm', 'tender'],
  dark: ['dark', 'night', 'tonight', 'late-night', 'heavy', 'void', 'shadow'],
  nostalgic: ['nostalgic', 'memory', 'remember', 'old', 'past'],
  angry: ['angry', 'rage', 'mad', 'furious', 'resent'],
  healing: ['healing', 'recover', 'healed', 'rest', 'repair'],
}

const THEME_KEYWORDS: Record<ThemeTag, string[]> = {
  love: ['love', 'lover', 'romance', 'heart', 'longing'],
  loss: ['loss', 'gone', 'grief', 'missing'],
  waiting: ['waiting', 'wait', 'holding on', 'someday'],
  memory: ['memory', 'remember', 'past', 'old times'],
  distance: ['distance', 'far', 'apart', 'miles'],
  self: ['myself', 'self', 'inside', 'identity', 'thoughts'],
  night: ['night', 'tonight', 'midnight', 'late-night', 'dark'],
  belonging: ['belong', 'belonging', 'home', 'safe'],
  silence: ['silence', 'quiet', 'stillness', 'unsaid'],
  home: ['home', 'kitchen', 'room', 'house'],
}

const TONE_KEYWORDS: Record<ToneTag, string[]> = {
  gentle: ['gentle', 'soft', 'calm', 'quiet'],
  intense: ['intense', 'heavy', 'burning', 'overwhelming'],
  raw: ['raw', 'honest', 'real', 'unfiltered'],
  dreamy: ['dreamy', 'floaty', 'tender', 'hazy'],
  melancholic: ['melancholic', 'sad', 'aching', 'blue'],
  warm: ['warm', 'hopeful', 'healing', 'bright'],
}

const LENGTH_KEYWORDS: Record<PoemLength, string[]> = {
  short: ['short', 'brief', 'quick'],
  medium: ['medium', 'balanced'],
  long: ['long', 'deep', 'detailed'],
}

const INTENSITY_HINTS: Array<{ value: 1 | 2 | 3 | 4 | 5; words: string[] }> = [
  { value: 5, words: ['devastating', 'crushing', 'intense'] },
  { value: 4, words: ['heavy', 'raw', 'aching'] },
  { value: 3, words: ['honest', 'steady', 'balanced'] },
  { value: 2, words: ['soft', 'gentle', 'warm'] },
  { value: 1, words: ['light', 'simple', 'easy'] },
]

type PartialIntent = Omit<IntentSnapshot, 'source'>

const clampConfidence = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))

const normalizeArray = <T extends readonly string[]>(values: unknown, allowed: T): T[number][] => {
  if (!Array.isArray(values)) return []
  const allowedSet = new Set(allowed)
  return values.filter((value): value is T[number] => typeof value === 'string' && allowedSet.has(value as T[number]))
}

const normalizeKeywords = (values: unknown) => {
  if (!Array.isArray(values)) return []
  return values
    .filter((value): value is string => typeof value === 'string')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8)
}

const normalizeLength = (value: unknown): PoemLength | undefined => {
  if (typeof value !== 'string') return undefined
  return (POEM_LENGTHS as readonly string[]).includes(value) ? (value as PoemLength) : undefined
}

const normalizeIntensity = (value: unknown): 1 | 2 | 3 | 4 | 5 | undefined => {
  if (typeof value !== 'number') return undefined
  if (value >= 1 && value <= 5) return Math.round(value) as 1 | 2 | 3 | 4 | 5
  return undefined
}

const extractJsonObject = (content: string) => {
  const match = content.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error('No JSON object found in Groq response')
  }
  return JSON.parse(match[0]) as Record<string, unknown>
}

const inferByKeywords = <T extends string>(text: string, definitions: Record<T, string[]>) =>
  (Object.entries(definitions) as Array<[T, string[]]>)
    .filter(([, words]) => words.some(word => text.includes(word)))
    .map(([key]) => key)

export const buildDeterministicIntent = (text: string): PartialIntent => {
  const normalized = text.toLowerCase()
  const moods = inferByKeywords(normalized, MOOD_KEYWORDS)
  const themes = inferByKeywords(normalized, THEME_KEYWORDS)
  const tones = inferByKeywords(normalized, TONE_KEYWORDS)

  const desiredLength = (Object.entries(LENGTH_KEYWORDS) as Array<[PoemLength, string[]]>)
    .find(([, words]) => words.some(word => normalized.includes(word)))?.[0]

  const desiredIntensity = INTENSITY_HINTS.find(entry =>
    entry.words.some(word => normalized.includes(word)),
  )?.value

  const keywords = Array.from(
    new Set(
      normalized
        .split(/[^a-z]+/)
        .map(value => value.trim())
        .filter(value => value.length >= 4),
    ),
  ).slice(0, 8)

  const signalCount = moods.length + themes.length + tones.length + (desiredLength ? 1 : 0) + (desiredIntensity ? 1 : 0)
  const confidence = clampConfidence(0.2 + signalCount * 0.12)

  return {
    moods,
    themes,
    tones,
    keywords,
    desiredLength,
    desiredIntensity,
    confidence,
  }
}

const mergeIntent = (base: PartialIntent, ai: PartialIntent | null): IntentSnapshot => {
  if (!ai) {
    return { ...base, source: 'deterministic' }
  }

  const mergeUnique = <T extends string>(left: T[], right: T[]) => Array.from(new Set([...left, ...right]))

  return {
    moods: mergeUnique(base.moods, ai.moods),
    themes: mergeUnique(base.themes, ai.themes),
    tones: mergeUnique(base.tones, ai.tones),
    keywords: mergeUnique(base.keywords, ai.keywords).slice(0, 8),
    desiredLength: ai.desiredLength ?? base.desiredLength,
    desiredIntensity: ai.desiredIntensity ?? base.desiredIntensity,
    confidence: clampConfidence(Math.max(base.confidence, ai.confidence)),
    source: 'groq',
  }
}

const buildRecentTranscript = (history: ChatMessage[]) =>
  history
    .slice(-6)
    .map(message => `${message.role}: ${message.content}`)
    .join('\n')

const fetchGroqIntent = async (message: string, history: ChatMessage[]): Promise<PartialIntent | null> => {
  const apiKey = process.env.GROQ_API_KEY
  const model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

  if (!apiKey || !model) {
    return null
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(6000),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: buildGroqIntentPrompt(message, buildRecentTranscript(history)),
        },
        {
          role: 'user',
          content: message,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Groq request failed with status ${response.status}`)
  }

  const json = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
  }

  const content = json.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Groq response did not include content')
  }

  const parsed = extractJsonObject(content)

  return {
    moods: normalizeArray(parsed.moods, MOOD_TAGS),
    themes: normalizeArray(parsed.themes, THEME_TAGS),
    tones: normalizeArray(parsed.tones, TONE_TAGS),
    keywords: normalizeKeywords(parsed.keywords),
    desiredLength: normalizeLength(parsed.desiredLength),
    desiredIntensity: normalizeIntensity(parsed.desiredIntensity),
    confidence: clampConfidence(typeof parsed.confidence === 'number' ? parsed.confidence : 0),
  }
}

export async function extractIntent(message: string, history: ChatMessage[]): Promise<IntentSnapshot> {
  const deterministicIntent = buildDeterministicIntent(message)

  try {
    const groqIntent = await fetchGroqIntent(message, history)
    return mergeIntent(deterministicIntent, groqIntent)
  } catch (error) {
    console.error('[parallax-intent] Falling back to deterministic intent extraction:', error)
    return { ...deterministicIntent, source: 'deterministic' }
  }
}
