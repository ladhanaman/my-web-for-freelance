import { buildDeterministicIntent, extractIntent } from './intent'
import { generateAiFollowUpReply } from './reply'
import { rankPoems } from './ranker'
import type {
  IntentSnapshot,
  ParallaxChatRequest,
  ParallaxChatResponse,
} from './types'

const LOOP_TURN_THRESHOLD = 5

const EXPLICIT_RECOMMEND_PATTERN =
  /\b(show me|just pick|surprise me|anything|whatever|pick one|give me something|just give me|just show|any poem|pick for me)\b/i

// Short deflecting replies that mean "I can't or won't elaborate"
const DEFLECTION_PATTERN =
  /^(nothing|idk|i (don'?t|dont) know|no|nope|not sure|dunno|maybe|ok+|fine|whatever|any(thing)?|not really|yeah|yep|sure|hm+|eh|meh|i guess|idc|doesn'?t matter|hard to say)[\s.,!?]*$/i

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!

const buildFollowUpQuestion = () =>
  'Tell me the mood you want, like soft and lonely, heavy and honest, or late-night thoughts.'

const buildRecommendationReply = (topTitle: string) =>
  pickRandom([
    `"${topTitle}" feels closest to that. Start there and see if it lands.`,
    `I found something close. Try "${topTitle}" first.`,
    `"${topTitle}" came up for that. See if the first card fits.`,
  ])

const buildLowSignalRecommendationReply = (topTitle: string) =>
  pickRandom([
    `Not a perfect read yet, but "${topTitle}" feels nearby. If it misses, tell me more.`,
    `I pulled something close. Start with "${topTitle}" — if it doesn't land, give me one more word.`,
  ])

const buildFallbackRecommendationReply = (topTitle: string) =>
  pickRandom([
    `Alright, let me just pick something. Try "${topTitle}" — if it doesn't land, tell me more.`,
    `I've been listening. Start with "${topTitle}" and let's go from there.`,
  ])

const buildDeflectionRecommendationReply = (topTitle: string) =>
  pickRandom([
    `You don't have to name it. Try "${topTitle}" — it might say it for you.`,
    `Sometimes a poem finds you. Start with "${topTitle}".`,
    `No words needed. "${topTitle}" might be closer than you think.`,
  ])

export function buildParallaxChatTurnFromIntent(
  input: Pick<ParallaxChatRequest, 'excludedPoemIds' | 'message' | 'history'>,
  intent: IntentSnapshot,
): Omit<ParallaxChatResponse, 'matchCycleId'> {
  const signalCount =
    intent.moods.length +
    intent.themes.length +
    intent.tones.length +
    (intent.desiredLength ? 1 : 0) +
    (intent.desiredIntensity ? 1 : 0)

  const hasEnoughContext = intent.confidence >= 0.6 && signalCount >= 2
  const rankedMatches = rankPoems(intent, input.excludedPoemIds)
  const scoredMatches = rankedMatches.filter(match => match.score > 0)
  const matches = scoredMatches.length > 0 ? scoredMatches : rankedMatches
  const topTitle = matches[0]?.poem.title ?? 'the first one'

  // How many user turns have already happened (messages before this one)
  const userTurnCount = (input.history ?? []).filter(m => m.role === 'user').length

  // Current message's deterministic signals — used to prevent off-topic messages
  // (e.g. "tell me about yourself") from triggering recommendations.
  const currentMessageIntent = buildDeterministicIntent(input.message)

  // Consider the signal meaningful if:
  // - the current message has explicit mood/theme/tone tags, OR
  // - Groq extracted a confident read from the accumulated conversation
  const hasMeaningfulSignalNow =
    currentMessageIntent.moods.length > 0 ||
    currentMessageIntent.themes.length > 0 ||
    currentMessageIntent.tones.length > 0 ||
    (intent.source === 'groq' && intent.confidence >= 0.3)

  // Any scored match qualifies; we already trust hasMeaningfulSignalNow for gating
  const canSoftRecommend = hasMeaningfulSignalNow && scoredMatches.length > 0

  // User explicitly asked to just pick something
  const userWantsAnything = EXPLICIT_RECOMMEND_PATTERN.test(input.message)

  // After LOOP_TURN_THRESHOLD back-and-forth turns with no recommendation, just pick
  const isInLoop = userTurnCount >= LOOP_TURN_THRESHOLD

  // User has deflected with a vague non-answer 2+ times — stop asking, just recommend
  const isDeflecting = DEFLECTION_PATTERN.test(input.message.trim())
  const isRepeatedlyDeflecting = isDeflecting && userTurnCount >= 2

  if (!hasEnoughContext) {
    if (canSoftRecommend) {
      return {
        reply: buildLowSignalRecommendationReply(topTitle),
        intent,
        nextAction: 'recommend',
        matches,
        showLoader: true,
      }
    }

    if (isRepeatedlyDeflecting) {
      return {
        reply: buildDeflectionRecommendationReply(topTitle),
        intent,
        nextAction: 'recommend',
        matches,
        showLoader: true,
      }
    }

    if (userWantsAnything || isInLoop) {
      return {
        reply: buildFallbackRecommendationReply(topTitle),
        intent,
        nextAction: 'recommend',
        matches,
        showLoader: true,
      }
    }

    return {
      reply: buildFollowUpQuestion(),
      intent,
      nextAction: 'ask_followup',
      matches: [],
      showLoader: false,
    }
  }

  return {
    reply: buildRecommendationReply(topTitle),
    intent,
    nextAction: 'recommend',
    matches,
    showLoader: true,
  }
}

export async function handleParallaxChatTurn(
  input: ParallaxChatRequest,
): Promise<Omit<ParallaxChatResponse, 'matchCycleId'>> {
  const intent = await extractIntent(input.message, input.history)
  const result = buildParallaxChatTurnFromIntent(
    { excludedPoemIds: input.excludedPoemIds, message: input.message, history: input.history },
    intent,
  )

  if (result.nextAction !== 'ask_followup') {
    return result
  }

  try {
    const aiReply = await generateAiFollowUpReply(input.message, input.history, intent)
    if (aiReply) {
      return { ...result, reply: aiReply }
    }
  } catch (error) {
    console.error('[parallax-reply] Groq unreachable, staying silent:', error)
  }

  // Groq unavailable — empty reply signals the UI to stay silent
  return { ...result, reply: '' }
}
