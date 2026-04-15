'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Post, Comment } from '@/types/tentalk'

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  const loadData = useCallback(async () => {
    const [{ data: postData }, { data: commentsData }, { data: { user } }, { count: likesCount }] = await Promise.all([
      supabase
        .from('posts')
        .select('*, profiles (display_name, avatar_url)')
        .eq('id', id)
        .single(),
      supabase
        .from('comments')
        .select('*, profiles (display_name, avatar_url)')
        .eq('post_id', id)
        .order('created_at', { ascending: true }),
      supabase.auth.getUser(),
      supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', id),
    ])

    if (postData) {
      setPost({ ...postData, likes_count: likesCount ?? 0 })
      setLikesCount(likesCount ?? 0)
    }
    if (commentsData) setComments(commentsData)
    if (user) {
      setMyUserId(user.id)
      const { data: myLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      setLiked(!!myLike)
    }
  }, [id, supabase])

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = async () => {
    if (!myUserId || post?.user_id !== myUserId) return
    if (!confirm('この投稿を削除しますか？')) return
    await supabase.from('posts').delete().eq('id', id)
    router.push('/tentalk')
  }

  const handleLike = async () => {
    if (!myUserId) return
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', myUserId)
      setLiked(false)
      setLikesCount(c => c - 1)
    } else {
      await supabase.from('likes').insert({ post_id: id, user_id: myUserId })
      setLiked(true)
      setLikesCount(c => c + 1)
    }
  }

  const handleComment = async () => {
    if (!newComment.trim() || !myUserId || submitting) return
    setSubmitting(true)
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: id, user_id: myUserId, content: newComment.trim() })
      .select('*, profiles (display_name, avatar_url)')
      .single()
    if (data) {
      setComments(prev => [...prev, data])
      setNewComment('')
    }
    setSubmitting(false)
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (!post) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400">読み込み中...</div>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">← 戻る</button>
          <h1 className="text-lg font-bold text-[#1A2F6E]">投稿詳細</h1>
        </div>
        {post.user_id === myUserId && (
          <button
            onClick={handleDelete}
            className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            投稿を削除
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {/* 投稿者 */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-[#1A2F6E] flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
            {post.profiles?.avatar_url
              ? <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
              : (post.profiles?.display_name?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-sm">{post.profiles?.display_name ?? '匿名'}</div>
            <div className="text-xs text-gray-400">{fmt(post.created_at)}</div>
          </div>
        </div>

        {/* 画像 */}
        {post.images.length > 0 && (
          <div className="relative bg-gray-100">
            <img src={post.images[imgIdx]} alt="" className="w-full aspect-square object-cover" />
            {post.images.length > 1 && (
              <>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                  {post.images.map((_, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
                {imgIdx > 0 && (
                  <button onClick={() => setImgIdx(i => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white w-8 h-8 rounded-full flex items-center justify-center">‹</button>
                )}
                {imgIdx < post.images.length - 1 && (
                  <button onClick={() => setImgIdx(i => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white w-8 h-8 rounded-full flex items-center justify-center">›</button>
                )}
              </>
            )}
          </div>
        )}

        {/* テキスト */}
        <div className="px-4 py-3">
          {post.caption && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">{post.caption}</p>
          )}
          {post.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.hashtags.map(tag => (
                <span key={tag} className="text-xs text-[#1A2F6E]">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* いいね */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-50">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm ${liked ? 'text-[#E8342A]' : 'text-gray-400 hover:text-[#E8342A]'} transition-colors`}
          >
            <span>{liked ? '❤️' : '🤍'}</span>
            <span>{likesCount}</span>
          </button>
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <span>💬</span>
            <span>{comments.length}</span>
          </span>
        </div>
      </div>

      {/* コメント一覧 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-50">
          <h2 className="text-sm font-medium text-gray-700">コメント（{comments.length}）</h2>
        </div>
        {comments.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            まだコメントはありません
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {comments.map(c => (
              <div key={c.id} className="px-4 py-3 flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1A2F6E] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                  {c.profiles?.avatar_url
                    ? <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (c.profiles?.display_name?.[0] ?? '?').toUpperCase()}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium">{c.profiles?.display_name ?? '匿名'}</span>
                    <span className="text-[10px] text-gray-400">{fmt(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* コメント入力 */}
      {myUserId && (
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
            placeholder="コメントを入力..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1A2F6E]"
          />
          <button
            onClick={handleComment}
            disabled={!newComment.trim() || submitting}
            className="bg-[#1A2F6E] text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            送信
          </button>
        </div>
      )}
    </div>
  )
}
