import { buildDeterministicIntent, extractIntent } from './intent'
import { buildFallbackFollowUpReply, generateAiFollowUpReply } from './reply'
import { rankPoems } from './ranker'
import type {
  IntentSnapshot,
  ParallaxChatRequest,
  ParallaxChatResponse,
} from './types'

const LOW_SIGNAL_MATCH_SCORE_THRESHOLD = 12
const LOOP_TURN_THRESHOLD = 5

const EXPLICIT_RECOMMEND_PATTERN =
  /\b(show me|just pick|surprise me|anything|whatever|pick one|give me something|just give me|just show|any poem|pick for me)\b/i

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
    `Not a perfect read yet, but "${topTitle}" feels nearby. If it misses, give me one more detail.`,
    `I pulled something close. Start with "${topTitle}" — if it doesn't land, tell me more.`,
  ])

const buildFallbackRecommendationReply = (topTitle: string) =>
  pickRandom([
    `Alright, let me just pick something. Try "${topTitle}" — if it doesn't land, tell me more.`,
    `I've been listening. Start with "${topTitle}" and let's go from there.`,
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

  // Use only the CURRENT message's signals to decide if soft-recommend is valid.
  // This prevents accumulated session intent from triggering recommendations
  // when the current message is off-topic (e.g. "tell me about yourself").
  const currentMessageIntent = buildDeterministicIntent(input.message)
  const hasMeaningfulSignalNow =
    currentMessageIntent.moods.length > 0 ||
    currentMessageIntent.themes.length > 0 ||
    currentMessageIntent.tones.length > 0

  const canSoftRecommend =
    hasMeaningfulSignalNow &&
    scoredMatches.length > 0 &&
    scoredMatches[0].score >= LOW_SIGNAL_MATCH_SCORE_THRESHOLD

  // User explicitly asked to just pick something
  const userWantsAnything = EXPLICIT_RECOMMEND_PATTERN.test(input.message)

  // After LOOP_TURN_THRESHOLD user turns with no recommendation, stop asking and just pick
  const userTurnCount = (input.history ?? []).filter(m => m.role === 'user').length
  const isInLoop = userTurnCount >= LOOP_TURN_THRESHOLD

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
      return {
        ...result,
        reply: aiReply,
      }
    }
  } catch (error) {
    console.error('[parallax-reply] Falling back to static follow-up reply:', error)
  }

  return {
    ...result,
    reply: buildFallbackFollowUpReply(input.message) || buildFollowUpQuestion(),
  }
}
