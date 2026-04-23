// Authenticated fetch wrapper — auto-refreshes token on 401
let _refreshPromise: Promise<string | null> | null = null

async function tryRefresh(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    .then(async (res) => {
      if (!res.ok) return null
      const data = await res.json()
      localStorage.setItem('access_token', data.accessToken)
      const payload = JSON.parse(atob(data.accessToken.split('.')[1]))
      const u = { id: payload.userId, email: payload.email, name: payload.name, role: payload.role }
      localStorage.setItem('auth_user', JSON.stringify(u))
      return data.accessToken as string
    })
    .finally(() => { _refreshPromise = null })
  return _refreshPromise
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('access_token')
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res = await fetch(input, { ...init, headers, credentials: 'include' })

  if (res.status === 401) {
    const newToken = await tryRefresh()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      res = await fetch(input, { ...init, headers, credentials: 'include' })
    } else {
      // Redirect to login
      localStorage.removeItem('access_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }
  }

  return res
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await apiFetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data as T
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data as T
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await apiFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data as T
}

export async function apiDelete(url: string): Promise<void> {
  const res = await apiFetch(url, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || 'Request failed')
  }
}
