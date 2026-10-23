import { useCallback, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api'
import AuthForm from './AuthForm'
import VehicleForm from './VehicleForm'

const EMPTY_FILTERS = {
  make: '',
  model: '',
  category: '',
  min_price: '',
  max_price: '',
}

const FILTERS = [
  ['make', 'Make'],
  ['model', 'Model'],
  ['category', 'Category'],
  ['min_price', 'Min price'],
  ['max_price', 'Max price'],
]

const COLORS = [
  'from-indigo-600 to-violet-700',
  'from-sky-600 to-indigo-700',
  'from-emerald-600 to-teal-700',
  'from-rose-600 to-orange-600',
]

function colorFor(category = '') {
  const sum = [...category].reduce((total, char) => total + char.charCodeAt(0), 0)
  return COLORS[sum % COLORS.length]
}

export default function App() {
  const [me, setMe] = useState(null)
  const [checking, setChecking] = useState(Boolean(getToken()))
  const [vehicles, setVehicles] = useState([])
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey((value) => value + 1)
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
        const results = await api('/api/vehicles/search', { params: filters })
        setVehicles(results)
      } catch (err) {
        if (err.status === 401) logout()
        else setError(err.message)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [me, filters, refreshKey, logout])

  async function run(action) {
    setError('')
    try {
      await action()
    } catch (err) {
      if (err.status === 401) logout()
      else setError(err.message)
    }
  }

  async function changeStock(vehicle, action) {
    await run(async () => {
      await api(`/api/vehicles/${vehicle.id}/${action}`, {
        method: 'POST',
        body: { quantity: 1 },
      })
      refresh()
    })
  }

  async function remove(vehicle) {
    if (!window.confirm(`Delete ${vehicle.make} ${vehicle.model}?`)) return

    await run(async () => {
      await api(`/api/vehicles/${vehicle.id}`, { method: 'DELETE' })
      refresh()
    })
  }

  async function save(body) {
    if (form === 'new') {
      await api('/api/vehicles', { method: 'POST', body })
    } else {
      await api(`/api/vehicles/${form.id}`, { method: 'PUT', body })
    }
    setForm(null)
    refresh()
  }

  if (checking) {
    return <p className="min-h-screen bg-slate-50 p-8">Loading…</p>
  }

  if (!me) {
    return <AuthForm onAuth={loadMe} />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
          <div className="text-xl font-black tracking-tight text-slate-900">
            <span className="mr-2 text-indigo-600">◆</span> DriveLot
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">{me.email}</span>
            {isAdmin && (
              <span className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-800">
                Admin
              </span>
            )}
            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-2 font-semibold hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-700 p-8 text-white sm:p-10">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-300">
              Explore the collection
            </p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              Find your next drive.
            </h1>
            <p className="mt-3 text-indigo-200">
              Discover, filter, and purchase from our live inventory.
            </p>
          </div>
          <div className="absolute -right-12 -top-20 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
        </section>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Inventory</h2>
            <p className="text-sm text-slate-500">
              {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} found
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setForm('new')}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
            >
              + Add vehicle
            </button>
          )}
        </div>

        <div className="mb-7 grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-6">
          {FILTERS.map(([key, label]) => (
            <input
              key={key}
              type={key.includes('price') ? 'number' : 'text'}
              min={key.includes('price') ? 0 : undefined}
              placeholder={label}
              value={filters[key]}
              onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
              className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          ))}
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-200"
          >
            Clear
          </button>
        </div>

        {form && (
          <VehicleForm
            key={form === 'new' ? 'new' : form.id}
            initial={form === 'new' ? null : form}
            onSubmit={save}
            onCancel={() => setForm(null)}
          />
        )}

        {error && (
          <p className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <article
              key={vehicle.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${colorFor(vehicle.category)} text-white`}
              >
                <span className="text-7xl drop-shadow-lg" aria-hidden="true">🚘</span>
                <span className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                  {vehicle.category}
                </span>
                <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800">
                  {vehicle.stock === 0 ? 'Sold out' : `${vehicle.stock} in stock`}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-black">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <span className="text-sm text-slate-500">{vehicle.year}</span>
                </div>

                <p className="mt-2 text-2xl font-black text-indigo-600">
                  ${Number(vehicle.price).toLocaleString()}
                </p>

                <button
                  onClick={() => changeStock(vehicle, 'purchase')}
                  disabled={vehicle.stock === 0}
                  className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {vehicle.stock === 0 ? 'Out of stock' : 'Purchase'}
                </button>

                {isAdmin && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => changeStock(vehicle, 'restock')}
                      className="rounded-lg bg-emerald-50 px-2 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Restock
                    </button>
                    <button
                      onClick={() => setForm(vehicle)}
                      className="rounded-lg bg-slate-100 px-2 py-2 text-sm font-semibold hover:bg-slate-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(vehicle)}
                      className="rounded-lg bg-red-50 px-2 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {vehicles.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No vehicles found. {isAdmin && 'Add one to get started.'}
          </div>
        )}
      </main>
    </div>
  )
}