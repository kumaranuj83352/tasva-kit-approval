'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Step = 'email' | 'otp' | 'password'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function requestOtp(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function verifyAndCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, otp, password }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem('access_token', data.accessToken)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      router.replace('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = step === 'email' ? 0 : 1

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-[#090d1b]">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-violet-400/8 dark:bg-violet-600/6 rounded-full blur-3xl" />
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] bg-indigo-400/8 dark:bg-indigo-600/6 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-7">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-xl shadow-violet-600/25">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Request access</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {step === 'email' ? 'Enter your details to get started' : `Verify the code sent to ${email}`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(['email', 'otp'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < stepIndex ? 'bg-emerald-500 text-white' : i === stepIndex ? 'bg-violet-600 text-white ring-4 ring-violet-600/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                {i < stepIndex ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (i + 1)}
              </div>
              {i < 1 && <div className={`w-8 h-px ${i < stepIndex ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-7">
          {step === 'email' && (
            <form onSubmit={requestOtp} className="space-y-4" noValidate>
              <div>
                <label htmlFor="name" className="label">Full name</label>
                <input
                  id="name"
                  type="text"
                  required
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="email" className="label">Work email</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 px-3.5 py-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-500/30">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <><span className="spinner" /> Sending code…</> : 'Send verification code →'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={verifyAndCreate} className="space-y-4" noValidate>
              <div>
                <label htmlFor="otp" className="label">6-digit verification code</label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  className="input tracking-[0.5em] text-center text-xl font-bold"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              </div>
              <div>
                <label htmlFor="password" className="label">Choose password</label>
                <input
                  id="password"
                  type="password"
                  required
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="label">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  required
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 px-3.5 py-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-500/30">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <><span className="spinner" /> Creating account…</> : 'Create account →'}
              </button>
              <button
                type="button"
                className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1"
                onClick={() => { setStep('email'); setError('') }}
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>

        <div className="mt-5 text-center">
          <Link href="/login" className="text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
