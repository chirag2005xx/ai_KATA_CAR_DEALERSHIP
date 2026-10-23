import { useState } from 'react'
import { api, setToken } from './api'

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)

    try {
      if (mode === 'register') {
        await api('/api/auth/register', {
          method: 'POST',
          body: { email, password },
        })
      }

      const result = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      setToken(result.access_token)
      await onAuth()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const input =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="text-2xl font-black tracking-tight">
          <span className="mr-2">◆</span> DriveLot
        </div>

        <div className="relative z-10">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-indigo-300">
            Your next journey starts here
          </p>
          <h1 className="max-w-xl text-6xl font-black leading-tight">
            Find your
            <br />
            next ride.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-indigo-200">
            Explore live inventory, find the right car, and purchase with confidence.
          </p>
        </div>

        <p className="text-sm text-indigo-300">Car dealership inventory system</p>
        <div className="absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute right-8 top-24 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
      </section>

      <section className="grid place-items-center p-6">
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-slate-200/80 sm:p-10"
        >
          <div className="mb-8">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-indigo-600">
              DriveLot
            </p>
            <h2 className="text-3xl font-black">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-2 text-slate-500">
              {mode === 'login'
                ? 'Log in to explore the inventory.'
                : 'Get started in a few seconds.'}
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Email
              <input
                className={`${input} mt-1.5`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Password
              <input
                className={`${input} mt-1.5`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            disabled={busy}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy
              ? 'Please wait…'
              : mode === 'login'
                ? 'Log in'
                : 'Register & log in'}
          </button>

          <button
            type="button"
            className="mt-5 w-full text-sm font-semibold text-indigo-600 hover:underline"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
          >
            {mode === 'login'
              ? "Don't have an account? Register"
              : 'Already have an account? Log in'}
          </button>
        </form>
      </section>
    </div>
  )
}