import Anthropic from '@anthropic-ai/sdk'

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// インスタ投稿のトーン定義
export const POST_TONES = {
  casual:       'カジュアル（親しみやすい、テント屋さんらしい口調）',
  formal:       '丁寧（プロフェッショナルな口調）',
  announcement: '告知風（新着・キャンペーン告知）',
  seasonal:     '季節もの（季節感を取り入れた投稿）',
} as const

export type PostTone = keyof typeof POST_TONES
