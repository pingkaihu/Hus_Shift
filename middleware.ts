import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { format, getISOWeek, getISOWeekYear } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getUser() (not getSession()) — validates JWT server-side
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (path.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      const now = toZonedTime(new Date(), 'Asia/Taipei')
      return NextResponse.redirect(
        new URL(`/schedule/${format(now, 'yyyy-MM')}`, request.url)
      )
    }
  }

  if (path === '/login' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'admin') {
      const now = toZonedTime(new Date(), 'Asia/Taipei')
      const week = `${getISOWeekYear(now)}-W${String(getISOWeek(now)).padStart(2, '0')}`
      return NextResponse.redirect(new URL(`/admin/schedule/${week}`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
