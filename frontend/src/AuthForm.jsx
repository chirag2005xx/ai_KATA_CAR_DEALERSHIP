import { useState } from 'react'
import { api, setToken } from './api'

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'register') {
        await api('/api/auth/register', { method: 'POST', body: { email, password } })
      }
      const { access_token } = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      setToken(access_token)
      onAuth()
    } catch (err) {
      setError(err.message)
    }
  }

  const input = 'w-full rounded border border-slate-300 px-3 py-2'

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow">
        <h1 className="text-xl font-bold">
          {mode === 'login' ? 'Log in' : 'Create account'}
        </h1>
        <input
          className={input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700">
          {mode === 'login' ? 'Log in' : 'Register & log in'}
        </button>
        <button
          type="button"
          className="w-full text-sm text-blue-600"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
        </button>
      </form>
    </div>
  )
}