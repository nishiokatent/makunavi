'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type NotificationRow = {
  id: string
  type: 'like' | 'comment'
  post_id: string
  from_user_id: string
  is_read: boolean
  created_at: string
  post_caption?: string
  from_display_name?: string
  from_avatar_url?: string | null
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // ① 通知取得（joinなし）
    const { data: notiData } = await supabase
      .from('notifications')
      .select('id, type, post_id, from_user_id, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!notiData?.length) {
      setLoading(false)
      return
    }

    const fromUserIds = [...new Set(notiData.map(n => n.from_user_id))]
    const postIds = [...new Set(notiData.map(n => n.post_id))]

    // ② プロフィール・投稿タイトルを並列取得
    const [{ data: profiles }, { data: posts }] = await Promise.all([
      supabase.from('profiles').select('id, display_name, avatar_url').in('id', fromUserIds),
      supabase.from('posts').select('id, caption').in('id', postIds),
    ])

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
    const postMap = Object.fromEntries((posts ?? []).map(p => [p.id, p]))

    setNotifications(notiData.map(n => ({
      ...n,
      post_caption: postMap[n.post_id]?.caption ?? '',
      from_display_name: profileMap[n.from_user_id]?.display_name ?? '誰か',
      from_avatar_url: profileMap[n.from_user_id]?.avatar_url ?? null,
    })))

    // 未読をすべて既読に
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setLoading(false)
  }, [supabase])

  useEffect(() => { loadNotifications() }, [loadNotifications])

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <h1 className="text-xl font-bold text-[#1A2F6E] mb-6">通知</h1>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-medium">通知はありません</p>
          <p className="text-sm mt-1">いいねやコメントがあると通知が届きます</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {notifications.map(n => (
            <Link
              key={n.id}
              href={`/tentalk/${n.post_id}`}
              className={`flex items-start gap-3 px-4 py-4 hover:bg-gray-50 transition-colors ${
                !n.is_read ? 'bg-blue-50/50' : ''
              }`}
            >
              {/* アバター */}
              <div className="w-9 h-9 rounded-full bg-[#1A2F6E] flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                {n.from_avatar_url ? (
                  <img src={n.from_avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (n.from_display_name?.[0] ?? '?').toUpperCase()
                )}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-snug">
                  <span className="font-medium">{n.from_display_name}</span>
                  {n.type === 'like' ? ' があなたの投稿にいいねしました' : ' があなたの投稿にコメントしました'}
                </p>
                {n.post_caption && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{n.post_caption}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{fmt(n.created_at)}</p>
              </div>

              {/* アイコン */}
              <div className="text-lg flex-shrink-0">
                {n.type === 'like' ? '❤️' : '💬'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
