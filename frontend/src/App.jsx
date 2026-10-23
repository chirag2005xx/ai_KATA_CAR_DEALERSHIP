import { useCallback, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api'
import AuthForm from './AuthForm'
import VehicleForm from './VehicleForm'

const NO_FILTERS = { make: '', model: '', category: '', min_price: '', max_price: '' }
const FILTER_FIELDS = [
  ['make', 'text'],
  ['model', 'text'],
  ['category', 'text'],
  ['min_price', 'number'],
  ['max_price', 'number'],
]

export default function App() {
  const [me, setMe] = useState(null)
  const [checking, setChecking] = useState(Boolean(getToken()))
  const [vehicles, setVehicles] = useState([])
  const [filters, setFilters] = useState(NO_FILTERS)
  const [form, setForm] = useState(null) // null | 'new' | vehicle object
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)

  const refresh = () => setTick((t) => t + 1)
  const isAdmin = me?.role === 'admin'

  const logout = useCallback(() => {
    setToken(null)
    setMe(null)
    setVehicles([])
  }, [])

  const loadMe = useCallback(async () => {
    try {
      setMe(await api('/api/auth/me'))
    } catch {
      setToken(null)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    if (getToken()) loadMe()
  }, [loadMe])

  useEffect(() => {
    if (!me) return
    const timer = setTimeout(async () => {
      try {
        setVehicles(await api('/api/vehicles/search', { params: filters }))
      } catch (err) {
        if (err.status === 401) logout()
        else setError(err.message)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [me, filters, tick, logout])

  async function run(fn) {
    setError('')
    try {
      await fn()
    } catch (err) {
      if (err.status === 401) logout()
      else setError(err.message)
    }
  }

  const replace = (u) => setVehicles((vs) => vs.map((x) => (x.id === u.id ? u : x)))
  const act = (v, action) =>
    run(async () =>
      replace(await api(`/api/vehicles/${v.id}/${action}`, { method: 'POST', body: { quantity: 1 } }))
    )
  const remove = (v) =>
    window.confirm(`Delete ${v.make} ${v.model}?`) &&
    run(async () => {
      await api(`/api/vehicles/${v.id}`, { method: 'DELETE' })
      refresh()
    })

  async function save(body) {
    if (form === 'new') await api('/api/vehicles', { method: 'POST', body })
    else await api(`/api/vehicles/${form.id}`, { method: 'PUT', body })
    setForm(null)
    refresh()
  }

  if (checking) return <p className="p-6">Loading…</p>
  if (!me) return <AuthForm onAuth={loadMe} />

  const btn = 'rounded px-3 py-1.5 text-sm font-medium'

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow">
        <h1 className="text-lg font-bold">Car Dealership</h1>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {me.email}
            {isAdmin && (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-amber-800">admin</span>
            )}
          </span>
          <button onClick={logout} className="text-blue-600">Log out</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-6">
          {FILTER_FIELDS.map(([k, type]) => (
            <input
              key={k}
              type={type}
              min={type === 'number' ? 0 : undefined}
              placeholder={k.replace('_', ' ')}
              value={filters[k]}
              onChange={(e) => setFilters({ ...filters, [k]: e.target.value })}
              className="rounded border border-slate-300 bg-white px-3 py-2"
            />
          ))}
          <button onClick={() => setFilters(NO_FILTERS)} className={`${btn} bg-slate-200 hover:bg-slate-300`}>
            Clear
          </button>
        </div>

        {isAdmin && !form && (
          <button onClick={() => setForm('new')} className={`${btn} mb-4 bg-green-600 text-white hover:bg-green-700`}>
            + Add vehicle
          </button>
        )}
        {form && (
          <VehicleForm
            key={form === 'new' ? 'new' : form.id}
            initial={form === 'new' ? null : form}
            onSubmit={save}
            onCancel={() => setForm(null)}
          />
        )}

        {error && <p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <div key={v.id} className="rounded-xl bg-white p-4 shadow">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{v.make} {v.model}</h3>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{v.category}</span>
              </div>
              <p className="text-sm text-slate-500">{v.year}</p>
              <p className="mt-2 text-lg font-bold">${Number(v.price).toLocaleString()}</p>
              <p className={`text-sm ${v.stock === 0 ? 'text-red-600' : 'text-slate-600'}`}>
                {v.stock === 0 ? 'Out of stock' : `${v.stock} in stock`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => act(v, 'purchase')}
                  disabled={v.stock === 0}
                  className={`${btn} bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300`}
                >
                  Purchase
                </button>
                {isAdmin && (
                  <>
                    <button onClick={() => act(v, 'restock')} className={`${btn} bg-emerald-100 text-emerald-800`}>
                      Restock +1
                    </button>
                    <button onClick={() => setForm(v)} className={`${btn} bg-slate-100`}>Edit</button>
                    <button onClick={() => remove(v)} className={`${btn} bg-red-100 text-red-700`}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {vehicles.length === 0 && <p className="text-slate-500">No vehicles found.</p>}
      </main>
    </div>
  )
}