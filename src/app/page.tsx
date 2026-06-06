'use client'

import { useState, useEffect } from 'react'

interface Book {
  id: string
  title: string
  pages: number | null
  genre: string | null
  publishedYear: number | null
}

interface Author {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  books: Book[]
  _count: {
    books: number
  }
}

export default function AuthorDashboard() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [nationality, setNationality] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchAuthors = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/authors')
      if (!res.ok) throw new Error('Error al obtener autores')
      const data = await res.json()
      setAuthors(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuthors()
  }, [])

  const openCreateModal = () => {
    setEditingAuthor(null)
    setName('')
    setEmail('')
    setBio('')
    setNationality('')
    setBirthYear('')
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (author: Author) => {
    setEditingAuthor(author)
    setName(author.name)
    setEmail(author.email)
    setBio(author.bio || '')
    setNationality(author.nationality || '')
    setBirthYear(author.birthYear ? String(author.birthYear) : '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este autor? Esto también eliminará todos sus libros.')) return

    try {
      const res = await fetch(`/api/authors/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar autor')
      }
      setAuthors(authors.filter(a => a.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)

    if (!name || !email) {
      setFormError('Nombre y email son requeridos')
      setSubmitting(false)
      return
    }

    const payload = {
      name,
      email,
      bio: bio || null,
      nationality: nationality || null,
      birthYear: birthYear ? parseInt(birthYear) : null
    }

    try {
      const url = editingAuthor ? `/api/authors/${editingAuthor.id}` : '/api/authors'
      const method = editingAuthor ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar autor')
      }

      setIsModalOpen(false)
      fetchAuthors()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate General Statistics
  const totalAuthors = authors.length
  const allBooks = authors.flatMap(a => a.books)
  const totalBooks = allBooks.length

  const booksWithPages = allBooks.filter(b => b.pages !== null)
  const averagePages = booksWithPages.length > 0
    ? Math.round(booksWithPages.reduce((sum, b) => sum + (b.pages || 0), 0) / booksWithPages.length)
    : 0

  const genreCounts: { [key: string]: number } = {}
  allBooks.forEach(b => {
    if (b.genre && b.genre.trim() !== '') {
      const g = b.genre.trim()
      genreCounts[g] = (genreCounts[g] || 0) + 1
    }
  })

  let topGenre = 'Ninguno'
  let maxGenreCount = 0
  Object.entries(genreCounts).forEach(([genre, count]) => {
    if (count > maxGenreCount) {
      maxGenreCount = count
      topGenre = genre
    }
  })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Dashboard de Autores
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Administra los autores de tu biblioteca y visualiza estadísticas generales.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          ➕ Agregar Autor
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Total de Autores</p>
          <p className="mt-2 text-3xl font-bold text-white">{loading ? '...' : totalAuthors}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-20">✍️</div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Total de Libros</p>
          <p className="mt-2 text-3xl font-bold text-white">{loading ? '...' : totalBooks}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-20">📖</div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Promedio de Páginas</p>
          <p className="mt-2 text-3xl font-bold text-white">{loading ? '...' : `${averagePages} págs.`}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-20">📄</div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Género más Común</p>
          <p className="mt-2 text-2xl font-bold text-indigo-400 truncate">{loading ? '...' : topGenre}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-20">🏷️</div>
        </div>
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-400 mb-6">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-800 bg-slate-900 p-6 h-56"></div>
          ))}
        </div>
      ) : authors.length === 0 ? (
        <div className="text-center rounded-xl border border-dashed border-slate-800 py-16">
          <span className="text-4xl">📭</span>
          <h3 className="mt-4 text-lg font-semibold text-slate-200">No hay autores registrados</h3>
          <p className="mt-2 text-sm text-slate-500">Comienza agregando un autor para construir tu biblioteca.</p>
          <button
            onClick={openCreateModal}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
          >
            Agregar mi primer autor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <div
              key={author.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 hover:bg-slate-900 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-white truncate max-w-[80%]">
                    {author.name}
                  </h3>
                  <span className="inline-flex items-center rounded-md bg-indigo-400/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-400/20">
                    {author._count?.books || 0} libros
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">{author.email}</p>
                {author.nationality && (
                  <p className="text-xs text-slate-500 mt-0.5">🌎 Nacionadidad: {author.nationality}</p>
                )}
                <p className="text-sm text-slate-300 mt-3 line-clamp-3 h-15">
                  {author.bio || 'Sin biografía disponible.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <a
                  href={`/authors/${author.id}`}
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  👁️ Ver Detalle
                </a>
                <button
                  onClick={() => openEditModal(author)}
                  className="inline-flex items-center justify-center rounded-md bg-amber-500/10 p-1.5 text-amber-400 ring-1 ring-inset ring-amber-500/20 hover:bg-amber-500/20 transition-colors"
                  title="Editar Autor"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(author.id)}
                  className="inline-flex items-center justify-center rounded-md bg-red-500/10 p-1.5 text-red-400 ring-1 ring-inset ring-red-500/20 hover:bg-red-500/20 transition-colors"
                  title="Eliminar Autor"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingAuthor ? 'Editar Autor' : 'Registrar Nuevo Autor'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-400">
                  ⚠️ {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Gabriel García Márquez"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ej. gabo@mail.com"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Nacionalidad
                  </label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={e => setNationality(e.target.value)}
                    placeholder="Ej. Colombiana"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Año de Nacimiento
                  </label>
                  <input
                    type="number"
                    value={birthYear}
                    onChange={e => setBirthYear(e.target.value)}
                    placeholder="Ej. 1927"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Biografía
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Breve reseña sobre el autor..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar Autor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
