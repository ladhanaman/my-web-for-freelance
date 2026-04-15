import { buildGroqFollowUpPrompt } from './prompts'
import type { ChatMessage, IntentSnapshot } from './types'

const GREETING_ONLY_PATTERN =
  /^(?:hi|hii+|hello|hey|heyy+|yo|sup|hola)(?:\s+there)?[!.,\s]*$/i

const DEFLECTION_ONLY_PATTERN =
  /^(nothing|idk|i (don'?t|dont) know|no|nope|not sure|dunno|maybe|ok+|fine|whatever|any(thing)?|not really|yeah|yep|sure|hm+|eh|meh|i guess|idc|doesn'?t matter|hard to say)[\s.,!?]*$/i

const buildRecentTranscript = (history: ChatMessage[]) =>
  history
    .slice(-6)
    .map(message => `${message.role}: ${message.content}`)
    .join('\n')

const extractJsonObject = (content: string) => {
  const match = content.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error('No JSON object found in Groq follow-up response')
  }
  return JSON.parse(match[0]) as Record<string, unknown>
}

const normalizeReply = (value: unknown) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''

export const isGreetingOnlyMessage = (message: string) => GREETING_ONLY_PATTERN.test(message.trim())

const FALLBACK_REPLIES = [
  "What's the weight of it — heavy, soft, somewhere in between?",
  "What kind of feeling are you sitting with?",
  "Is it something with more quiet to it, or more weight?",
  "Tell me something small about it — even the texture is enough.",
  "What does tonight feel like for you?",
]

const DEFLECTION_FALLBACK_REPLIES = [
  "That's okay. Something soft and quiet, or something with a bit more to it?",
  "Hard to name sometimes. Should I just find something that fits a still moment?",
  "No pressure. Soft or heavy — which direction?",
]

const GREETING_FALLBACKS = [
  "Hey. What are you in the mood for tonight?",
  "Hey. What's sitting with you right now?",
  "Hey. What kind of feeling brought you here?",
]

const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]!

export const buildFallbackFollowUpReply = (message: string) => {
  if (isGreetingOnlyMessage(message)) {
    return pickRandom(GREETING_FALLBACKS)
  }

  if (DEFLECTION_ONLY_PATTERN.test(message.trim())) {
    return pickRandom(DEFLECTION_FALLBACK_REPLIES)
  }

  return pickRandom(FALLBACK_REPLIES)
}

export async function generateAiFollowUpReply(
  message: string,
  history: ChatMessage[],
  intent: IntentSnapshot,
): Promise<string | null> {
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
      temperature: 0.75,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: buildGroqFollowUpPrompt(
            message,
            buildRecentTranscript(history),
            JSON.stringify(intent),
          ),
        },
        {
          role: 'user',
          content: message,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Groq follow-up request failed with status ${response.status}`)
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
    throw new Error('Groq follow-up response did not include content')
  }

  const parsed = extractJsonObject(content)
  const reply = normalizeReply(parsed.reply)

  return reply.length > 0 ? reply : null
}
