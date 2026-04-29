import { NextResponse, type NextRequest } from 'next/server'
import { claude } from '@/lib/claude/client'

const MODEL = 'claude-opus-4-6'

export type TentalkTone = 'memo' | 'report' | 'matome' | 'ask'
export type InstagramTone = 'bright' | 'tryIt' | 'trust' | 'seasonal'

const TENTALK_TONE_LABELS: Record<TentalkTone, string> = {
  memo:   '職人メモ風',
  report: 'ひとこと報告',
  matome: 'まとめ投稿',
  ask:    'みんなに聞いてみる',
}

const INSTAGRAM_TONE_LABELS: Record<InstagramTone, string> = {
  bright:   '明るく元気に',
  tryIt:    '使ってみたいな',
  trust:    '品質・信頼を伝える',
  seasonal: '季節感を添えて',
}

interface GenerateInput {
  fabric: string
  size: string
  type: string
  base: string
  note: string
  background: string
  area: string
  season?: string
  customerVoice?: string
  tentalkTone: TentalkTone
  instagramTone: InstagramTone
}

const NONE = '情報なし（この項目には触れないこと）'
const orNone = (v?: string) => (v && v.trim() ? v.trim() : NONE)

function buildTentalkPrompt(i: GenerateInput): string {
  return `あなたはテント工事の職人向けSNS「テントーク」への投稿文を書くアシスタントです。
読み手は同業のテント屋・職人です。一般消費者向けではありません。

以下の施工情報をもとに、指定されたトーンで投稿文を作成してください。

【施工情報】
- 使用生地（素材）：${orNone(i.fabric)}
- サイズ：${orNone(i.size)}
- 施工タイプ：${orNone(i.type)}
- 取付け場所・下地：${orNone(i.base)}
- 工夫・苦労した点：${orNone(i.note)}
- お客様の要望・背景：${orNone(i.background)}
- 施工エリア：${orNone(i.area)}

【トーン指定】${TENTALK_TONE_LABELS[i.tentalkTone]}

【トーン別ルール】
- 職人メモ風：素材・サイズ・施工上のポイントを具体的に。同業者が参考にできる内容。絵文字控えめ。
- ひとこと報告：親しみやすい口語調。施工仕様は入れつつ軽いテンション。絵文字少量OK。
- まとめ投稿：です・ます調。工程や背景を含めてまとめ記事のように。
- みんなに聞いてみる：施工報告の後に「みなさんはどうしてますか？」など同業者への問いかけを入れる。

【出力ルール】
- ハッシュタグは不要
- 文字数は100〜180字程度
- 施工数値（サイズ・素材名など）は必ず本文中に入れる
- SNS映え狙った表現は不要
- 同業者が参考になる／共感できる内容を優先する

【出力形式】
本文のみをそのまま出力してください。前置き・後書き・説明・見出しは不要です。`
}

function buildInstagramPrompt(i: GenerateInput): string {
  return `あなたはテント工事会社のInstagram投稿文を書くアシスタントです。
読み手は一般消費者・店舗オーナー・施主です。

以下の施工情報をもとに、指定されたトーンでInstagram投稿文を作成してください。

【施工情報】
- 使用生地（素材）：${orNone(i.fabric)}
- サイズ：${orNone(i.size)}
- 施工タイプ：${orNone(i.type)}
- 取付け場所・下地：${orNone(i.base)}
- 工夫・苦労した点：${orNone(i.note)}
- お客様の要望・背景：${orNone(i.background)}
- 施工エリア：${orNone(i.area)}
- 季節・シーン：${orNone(i.season)}
- お客様への一言：${orNone(i.customerVoice)}

【トーン指定】${INSTAGRAM_TONE_LABELS[i.instagramTone]}

【トーン別ルール】
- 明るく元気に：明るく爽快感ある言葉選び。空間の変化・開放感を表現。
- 使ってみたいな：「こんな使い方ができます」と目線を生活を豊かにするイメージ。
- 品質・信頼を伝える：素材・技術への誠実さをアピール。丁寧に作る、長持ちする、など信頼ワード。
- 季節感を添えて：季節の描写と絡めて読んで気持ちいい文章。詩的すぎず自然に。

【出力ルール】
- 本文：120〜200字程度
- 絵文字を効果的に使う（3〜5個程度）
- ハッシュタグ：15〜20個
- ハッシュタグ内訳：施工系・素材系・地域系・生活提案系をバランスよく混ぜる
- サイズや素材名など専門数値は入れすぎず、自然な文脈で1〜2箇所まで
- 「施工事例」「工事完了」などの無機質な言葉は避ける
- 読んだ人が「ちょっとやってみたい」と思えるような文末を意識する

【出力形式】
必ず以下のJSONのみを出力してください。前置き・コードブロック・説明は不要です。
{"body":"本文（ハッシュタグは含めない・絵文字可・改行は \\n）","hashtags":["タグ1","タグ2","…"]}
ハッシュタグは "#" を含めず、ワード部分のみの配列にしてください。`
}

async function generateText(prompt: string): Promise<string> {
  const message = await claude.messages.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })
  const first = message.content[0]
  return first?.type === 'text' ? first.text.trim() : ''
}

function stripJsonFence(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}

interface InstagramResult {
  body: string
  hashtags: string[]
}

function parseInstagramJson(text: string): InstagramResult {
  const cleaned = stripJsonFence(text)
  try {
    const parsed = JSON.parse(cleaned) as { body?: unknown; hashtags?: unknown }
    const body = typeof parsed.body === 'string' ? parsed.body : ''
    const hashtags = Array.isArray(parsed.hashtags)
      ? parsed.hashtags.filter((t): t is string => typeof t === 'string').map(t => t.replace(/^#/, ''))
      : []
    return { body, hashtags }
  } catch {
    return { body: cleaned, hashtags: [] }
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as Partial<GenerateInput>

    const hasAny =
      (input.type && input.type.trim()) ||
      (input.fabric && input.fabric.trim()) ||
      (input.size && input.size.trim()) ||
      (input.note && input.note.trim()) ||
      (input.background && input.background.trim())

    if (!hasAny) {
      return NextResponse.json(
        { error: '施工情報をいずれか1項目以上入力してください' },
        { status: 400 }
      )
    }

    const full: GenerateInput = {
      fabric: input.fabric ?? '',
      size: input.size ?? '',
      type: input.type ?? '',
      base: input.base ?? '',
      note: input.note ?? '',
      background: input.background ?? '',
      area: input.area ?? '',
      season: input.season ?? '',
      customerVoice: input.customerVoice ?? '',
      tentalkTone: (input.tentalkTone as TentalkTone) ?? 'memo',
      instagramTone: (input.instagramTone as InstagramTone) ?? 'bright',
    }

    const [tentalkText, instagramText] = await Promise.all([
      generateText(buildTentalkPrompt(full)),
      generateText(buildInstagramPrompt(full)),
    ])

    const instagram = parseInstagramJson(instagramText)

    return NextResponse.json({
      tentalk: tentalkText,
      instagram,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[tentalk/generate-caption]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
