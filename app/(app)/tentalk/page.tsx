'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/types/tentalk'

export default function TenTalkPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [myUserId, setMyUserId] = useState<string | null>(null)

  const supabase = createClient()

  const loadPosts = useCallback(async () => {
    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) { console.error('Posts load error:', error); return }
    if (!postsData?.length) { setPosts([]); return }

    const postIds = postsData.map(p => p.id)
    const userIds = [...new Set(postsData.map(p => p.user_id))]

    const [{ data: profiles }, { data: likeCounts }, { data: commentCounts }] = await Promise.all([
      supabase.from('profiles').select('id, display_name, avatar_url').in('id', userIds),
      supabase.from('likes').select('post_id').in('post_id', postIds),
      supabase.from('comments').select('post_id').in('post_id', postIds),
    ])

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
    const likeMap: Record<string, number> = {}
    const commentMap: Record<string, number> = {}
    likeCounts?.forEach(l => { likeMap[l.post_id] = (likeMap[l.post_id] ?? 0) + 1 })
    commentCounts?.forEach(c => { commentMap[c.post_id] = (commentMap[c.post_id] ?? 0) + 1 })

    setPosts(postsData.map(p => ({
      ...p,
      profiles: profileMap[p.user_id] ?? null,
      likes_count: likeMap[p.id] ?? 0,
      comments_count: commentMap[p.id] ?? 0,
    })))
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMyUserId(user?.id ?? null)

      if (user) {
        const { data: myLikes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
        if (myLikes) setLikedIds(new Set(myLikes.map((l: { post_id: string }) => l.post_id)))
      }

      await loadPosts()
      setLoading(false)
    }
    init()
  }, [supabase, loadPosts])

  const handleLike = async (postId: string) => {
    if (!myUserId) return
    const already = likedIds.has(postId)

    if (already) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', myUserId)
      setLikedIds(prev => { const s = new Set(prev); s.delete(postId); return s })
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: myUserId })
      setLikedIds(prev => new Set(prev).add(postId))
    }

    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, likes_count: (p.likes_count ?? 0) + (already ? -1 : 1) }
        : p
    ))
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('この投稿を削除しますか？')) return
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const formatDate = (iso: string) =>
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
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A2F6E]">テントーク</h1>
          <p className="text-xs text-gray-400">テント屋専用SNS</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/tentalk/profile"
            className="text-sm text-gray-500 hover:text-[#1A2F6E] px-3 py-2 rounded-lg hover:bg-white transition-colors"
          >
            👤 マイページ
          </Link>
          <Link
            href="/tentalk/new"
            className="bg-[#1A2F6E] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#152560] transition-colors"
          >
            + 投稿する
          </Link>
        </div>
      </div>

      {/* 投稿一覧 */}
      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium">まだ投稿がありません</p>
          <p className="text-sm mt-1">最初の施工写真を投稿してみましょう</p>
          <Link href="/tentalk/new" className="inline-block mt-4 bg-[#1A2F6E] text-white text-sm px-6 py-2 rounded-lg">
            投稿する
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              liked={likedIds.has(post.id)}
              isOwn={post.user_id === myUserId}
              onLike={() => handleLike(post.id)}
              onDelete={() => handleDelete(post.id)}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PostCard({
  post,
  liked,
  isOwn,
  onLike,
  onDelete,
  formatDate,
}: {
  post: Post
  liked: boolean
  isOwn: boolean
  onLike: () => void
  onDelete: () => void
  formatDate: (iso: string) => string
}) {
  const [imgIdx, setImgIdx] = useState(0)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-[#1A2F6E] flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            (post.profiles?.display_name?.[0] ?? '?').toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-gray-800">{post.profiles?.display_name ?? '匿名'}</div>
          <div className="text-xs text-gray-400">{formatDate(post.created_at)}</div>
        </div>
        {isOwn && (
          <button
            onClick={onDelete}
            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            削除
          </button>
        )}
      </div>

      {/* 画像 */}
      {post.images.length > 0 && (
        <div className="relative bg-gray-100">
          <img
            src={post.images[imgIdx]}
            alt={`投稿画像 ${imgIdx + 1}`}
            className="w-full aspect-square object-cover"
          />
          {post.images.length > 1 && (
            <>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {post.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
              {imgIdx > 0 && (
                <button onClick={() => setImgIdx(i => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">‹</button>
              )}
              {imgIdx < post.images.length - 1 && (
                <button onClick={() => setImgIdx(i => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">›</button>
              )}
            </>
          )}
        </div>
      )}

      {/* テキスト */}
      <div className="px-4 py-3">
        {post.caption && (
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-2">{post.caption}</p>
        )}
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.hashtags.map(tag => (
              <span key={tag} className="text-xs text-[#1A2F6E]">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* アクション */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-50">
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-[#E8342A]' : 'text-gray-400 hover:text-[#E8342A]'}`}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{post.likes_count ?? 0}</span>
        </button>
        <Link href={`/tentalk/${post.id}`} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
          <span>💬</span>
          <span>{post.comments_count ?? 0}</span>
        </Link>
      </div>
    </div>
  )
}
