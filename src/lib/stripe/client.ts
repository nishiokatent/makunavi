import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

// プランごとのPrice ID
export const STRIPE_PRICES = {
  lite: {
    monthly: process.env.STRIPE_PRICE_LITE_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_LITE_YEARLY!,
  },
  standard: {
    monthly: process.env.STRIPE_PRICE_STANDARD_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_STANDARD_YEARLY!,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
  },
  monitor_graduate: process.env.STRIPE_PRICE_MONITOR_GRADUATE!,
} as const

// トライアル期間（60日 = 2ヶ月）
export const TRIAL_PERIOD_DAYS = 60
