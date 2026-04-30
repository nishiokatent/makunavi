import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ログイン不要なパス
const PUBLIC_PATHS = ['/login', '/pricing', '/auth/callback']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession()はcookieを読むだけ（ネットワーク通信なし・高速）
  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
    || pathname.startsWith('/api/')

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ログイン済みでloginページにアクセスしたらダッシュボードへ
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 初回ログイン時の必須項目チェック
  // display_name または company_name が未設定なら /settings/account へ誘導
  if (session && !isPublic && !pathname.startsWith('/settings/account')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, company_name')
      .eq('id', session.user.id)
      .single()
    const incomplete =
      !profile?.display_name?.trim() || !profile?.company_name?.trim()
    if (incomplete) {
      return NextResponse.redirect(new URL('/settings/account?required=1', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
