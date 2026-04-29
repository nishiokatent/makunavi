// プラン種別
export type Plan = 'lite' | 'standard' | 'pro' | 'monitor_graduate'

// ユーザープロフィール（Supabase: profiles テーブル）
export type Profile = {
  id: string
  email: string
  company_name: string | null
  plan: Plan
  is_monitor_graduate: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_end_at: string | null
  created_at: string
  updated_at: string
}

// 見積もり（Supabase: quotes テーブル）
export type Quote = {
  id: string
  user_id: string
  client_name: string
  title: string
  total_amount: number
  items: QuoteItem[]
  created_at: string
  updated_at: string
}

export type QuoteItem = {
  id: string
  name: string
  quantity: number
  unit: string
  unit_price: number
  amount: number
}

// 要尺GPスコア（Supabase: yojaku_scores テーブル）
export type YojakuScore = {
  id: string
  user_id: string
  time_ms: number
  correct_count: number
  created_at: string
}

// プランごとのアクセス権限
export const PLAN_FEATURES: Record<Plan, string[]> = {
  lite: ['tenmitsukun'],
  standard: ['tenmitsukun', 'tentsukun', 'yojakugp'],
  pro: ['tenmitsukun', 'tentsukun', 'yojakugp', 'insta', 'portfolio'],
  monitor_graduate: ['tenmitsukun', 'tentsukun', 'yojakugp'],
}
