const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const getToken = () => localStorage.getItem('token')
export const setToken = (t) =>
  t ? localStorage.setItem('token', t) : localStorage.removeItem('token')

export async function api(path, { method = 'GET', body, params } = {}) {
  const query = params
    ? new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== '' && v != null)
      ).toString()
    : ''
  const res = await fetch(BASE + path + (query ? `?${query}` : ''), {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((d) => d.msg).join(', ')
      : data.detail
    const err = new Error(detail || 'Request failed')
    err.status = res.status
    throw err
  }
  return data
}