export const PARALLAX_POEM_COUNT = 7

export const PARALLAX_INITIAL_MESSAGE =
  "Hi there. Tell me how you're feeling, and I'll pull three poems from Naman's work that fit the moment."

export const PARALLAX_STARTER_CHIPS = [
  'Something soft tonight',
  'Heavy and honest',
  'Love and longing',
  'Late-night thoughts',
  'I need hope',
  'Keep it short',
] as const

export const DOT_LOADER_FRAMES: number[][] = [
  [14, 7, 0, 8, 6, 13, 20],
  [14, 7, 13, 20, 16, 27, 21],
  [14, 20, 27, 21, 34, 24, 28],
  [27, 21, 34, 28, 41, 32, 35],
  [34, 28, 41, 35, 48, 40, 42],
  [34, 28, 41, 35, 48, 42, 46],
  [34, 28, 41, 35, 48, 42, 38],
  [34, 28, 41, 35, 48, 30, 21],
  [34, 28, 41, 48, 21, 22, 14],
  [34, 28, 41, 21, 14, 16, 27],
  [34, 28, 21, 14, 10, 20, 27],
  [28, 21, 14, 4, 13, 20, 27],
  [28, 21, 14, 12, 6, 13, 20],
  [28, 21, 14, 6, 13, 20, 11],
  [28, 21, 14, 6, 13, 20, 10],
  [14, 6, 13, 20, 9, 7, 21],
]

export const MINIMUM_MATCH_LOADER_MS = 4000
export const DOT_LOADER_FRAME_DURATION_MS = 130
export const DOT_LOADER_REPEAT_COUNT = Math.max(
  1,
  Math.ceil(MINIMUM_MATCH_LOADER_MS / (DOT_LOADER_FRAMES.length * DOT_LOADER_FRAME_DURATION_MS)),
)
