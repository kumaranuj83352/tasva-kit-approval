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
      className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Toggle dark mode"
    >
      {dark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14A7 7 0 0012 5z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
        </svg>
      )}
    </button>
  )
}

function NavSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 h-14 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center px-6">
        <div className="skeleton h-4 w-24 rounded" />
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="skeleton h-7 w-48 rounded-lg" />
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
    admin: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    store: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    qc: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    cad: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    bnm: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    fgsourcing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080c14]">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand + nav */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <span className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shadow-sm group-hover:bg-violet-500 transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </span>
              <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 hidden sm:inline">
                Kit Approval
              </span>
            </Link>

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
                    className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-600 dark:bg-violet-400" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-3 pl-3 ml-1 border-l border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">{user.name}</p>
                  <span className={`mt-0.5 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${roleColors[user.role] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="btn-ghost text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 px-2"
              >
                {loggingOut ? <span className="spinner w-3 h-3" /> : 'Sign out'}
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="text-xs text-slate-500">{user.name}</span>
              </div>
              <button onClick={handleLogout} className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium">
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
