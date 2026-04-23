'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/lib/AuthContext'

function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])
  function toggle() {
    const isDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    setDark(isDark)
  }
  return (
    <button
      onClick={toggle}
      className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-all duration-150"
      aria-label="Toggle theme"
    >
      {dark ? (
        <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  )
}

function NavSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d1b]">
      <header className="sticky top-0 z-50 h-16 bg-white dark:bg-[#090d1b] border-b border-slate-200/70 dark:border-white/[0.06] flex items-center px-6 gap-3">
        <div className="w-8 h-8 skeleton rounded-xl" />
        <div className="skeleton h-4 w-24 rounded-md" />
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div className="skeleton h-7 w-52 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-8 w-12 rounded" />
            </div>
          ))}
        </div>
        <div className="card p-5 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-10 w-full rounded-lg" />
          ))}
        </div>
      </main>
    </div>
  )
}

export function NavShell({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading || !user) return <NavSkeleton />

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    router.replace('/login')
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/kits', label: 'Kits' },
    ...(user.role === 'admin' ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  const roleColors: Record<string, string> = {
    admin: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    store: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    qc: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    cad: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
    design: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
    bnm: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    fgsourcing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d1b]">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#090d1b]/90 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* ── Left: brand + nav ────────────────── */}
          <div className="flex items-center gap-1 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0 mr-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-sm shadow-violet-500/40 group-hover:shadow-violet-500/60 transition-shadow duration-200 flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 hidden sm:inline">
                Kit Approval
              </span>
            </Link>

            <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-white/[0.08] mx-3 flex-shrink-0" />

            <nav className="hidden sm:flex items-center gap-0.5" aria-label="Main navigation">
              {navLinks.map((link) => {
                const active = link.href === '/kits'
                  ? pathname.startsWith('/kits')
                  : link.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.08]'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* ── Right: theme + user ────────────────── */}
          <div className="flex items-center gap-1">
            <ThemeToggle />

            <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-white/[0.08] mx-2 flex-shrink-0" />

            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                {user.name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[110px]">
                  {user.name}
                </p>
                <span className={`mt-0.5 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${roleColors[user.role] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                title="Sign out"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150 flex-shrink-0"
              >
                {loggingOut ? (
                  <span className="spinner w-3.5 h-3.5" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                )}
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown ──────────────────── */}
        {menuOpen && (
          <div className="sm:hidden border-t border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-[#0f1628] px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const active = link.href === '/kits'
                ? pathname.startsWith('/kits')
                : link.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="pt-2.5 mt-1.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">{user.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NavShell>{children}</NavShell>
    </AuthProvider>
  )
}

