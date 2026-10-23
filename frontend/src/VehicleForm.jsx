import { useState } from 'react'

const EMPTY = {
  make: '',
  model: '',
  category: '',
  year: new Date().getFullYear(),
  price: '',
  stock: 0,
}

export default function VehicleForm({ initial, onSubmit, onCancel }) {
  const editing = Boolean(initial)
  const [f, setF] = useState(initial ?? EMPTY)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    const body = {
      make: f.make,
      model: f.model,
      category: f.category,
      year: Number(f.year),
      price: Number(f.price),
    }
    if (!editing) body.stock = Number(f.stock)
    try {
      await onSubmit(body)
    } catch (err) {
      setError(err.message)
    }
  }

  const fields = [
    ['make', 'text'],
    ['model', 'text'],
    ['category', 'text'],
    ['year', 'number'],
    ['price', 'number'],
    ...(editing ? [] : [['stock', 'number']]),
  ]

  return (
    <form onSubmit={submit} className="mb-6 rounded-xl bg-white p-4 shadow">
      <h2 className="mb-3 font-semibold">{editing ? 'Edit vehicle' : 'Add vehicle'}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {fields.map(([k, type]) => (
          <input
            key={k}
            className="rounded border border-slate-300 px-3 py-2"
            type={type}
            step={k === 'price' ? '0.01' : undefined}
            min={type === 'number' ? 0 : undefined}
            placeholder={k}
            value={f[k]}
            onChange={set(k)}
            required
          />
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Save
        </button>
        <button type="button" onClick={onCancel} className="rounded px-4 py-2 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  )
}