'use client'

import { useState, useEffect } from 'react'

interface Author {
  id: string
  name: string
}

interface Book {
  id: string
  title: string
  description: string | null
  isbn: string | null
  publishedYear: number | null
  genre: string | null
  pages: number | null
  authorId: string
  author: {
    id: string
    name: string
    email: string
  }
}

export default function BookSearchPage() {
  // Data lists
  const [books, setBooks] = useState<Book[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtering / pagination states
  const [search, setSearch] = useState('')
  const [genreFilter, setGenreFilter] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [limit] = useState(6) // 6 items per page fits nicely in grids
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Form modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isbn, setIsbn] = useState('')
  const [publishedYear, setPublishedYear] = useState('')
  const [genre, setGenre] = useState('')
  const [pages, setPages] = useState('')
  const [selectedAuthorId, setSelectedAuthorId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Fetch lists
  const fetchAuthors = async () => {
    try {
      const res = await fetch('/api/authors')
      if (!res.ok) throw new Error('Error al obtener autores')
      const data = await res.json()
      setAuthors(data)
    } catch (err: any) {
      console.error(err.message)
    }
  }

  const fetchBooks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        order
      })

      if (search) params.append('search', search)
      if (genreFilter) params.append('genre', genreFilter)
      if (authorFilter) params.append('authorId', authorFilter)

      const res = await fetch(`/api/books/search?${params.toString()}`)
      if (!res.ok) throw new Error('Error al buscar libros')
      const data = await res.json()
      setBooks(data.data)
      setTotal(data.pagination.total)
      setTotalPages(data.pagination.totalPages)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Effect to refetch books on filter change
  useEffect(() => {
    fetchBooks()
  }, [page, genreFilter, authorFilter, sortBy, order])

  // Debounced/delayed search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1)
      fetchBooks()
    }, 350) // Debounce search input
    return () => clearTimeout(handler)
  }, [search])

  useEffect(() => {
    fetchAuthors()
  }, [])

  const openCreateModal = () => {
    setEditingBook(null)
    setTitle('')
    setDescription('')
    setIsbn('')
    setPublishedYear('')
    setGenre('')
    setPages('')
    setSelectedAuthorId(authors[0]?.id || '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (book: Book) => {
    setEditingBook(book)
    setTitle(book.title)
    setDescription(book.description || '')
    setIsbn(book.isbn || '')
    setPublishedYear(book.publishedYear ? String(book.publishedYear) : '')
    setGenre(book.genre || '')
    setPages(book.pages ? String(book.pages) : '')
    setSelectedAuthorId(book.authorId)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este libro?')) return

    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar libro')
      }
      fetchBooks()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)

    if (!title || !selectedAuthorId) {
      setFormError('Título y Autor son requeridos')
      setSubmitting(false)
      return
    }

    if (title.length < 3) {
      setFormError('El título debe tener al menos 3 caracteres')
      setSubmitting(false)
      return
    }

    const payload = {
      title,
      description: description || null,
      isbn: isbn || null,
      publishedYear: publishedYear ? parseInt(publishedYear) : null,
      genre: genre || null,
      pages: pages ? parseInt(pages) : null,
      authorId: selectedAuthorId
    }

    try {
      const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books'
      const method = editingBook ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar libro')
      }

      setIsModalOpen(false)
      fetchBooks()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Predefined genres for filter & select options
  const defaultGenres = ['Novela', 'Fantasía', 'Drama', 'Ciencia Ficción', 'Terror', 'Historia', 'Poesía', 'Biografía', 'Ensayo']

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Buscador de Libros
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Busca, filtra, ordena y gestiona todos los libros de tu biblioteca.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          ➕ Agregar Libro
        </button>
      </div>

      {/* Filters and Search Bar Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 mb-8 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Genre Filter */}
          <div className="md:col-span-3">
            <select
              value={genreFilter}
              onChange={e => { setGenreFilter(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todos los géneros</option>
              {defaultGenres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Author Filter */}
          <div className="md:col-span-3">
            <select
              value={authorFilter}
              onChange={e => { setAuthorFilter(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todos los autores</option>
              {authors.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
          <div className="text-sm text-slate-400">
            Mostrando <span className="font-semibold text-indigo-400">{total}</span> resultados
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              Ordenar por:
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="createdAt">Fecha de Registro</option>
              <option value="title">Título</option>
              <option value="publishedYear">Año de Publicación</option>
            </select>

            <select
              value={order}
              onChange={e => setOrder(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
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
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/60 p-6 h-64"></div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center rounded-xl border border-dashed border-slate-800 py-20">
          <span className="text-4xl">📚</span>
          <h3 className="mt-4 text-lg font-semibold text-slate-200">No se encontraron libros</h3>
          <p className="mt-2 text-sm text-slate-500">Prueba con otros términos de búsqueda o filtros.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {books.map((book) => (
              <div
                key={book.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 hover:bg-slate-900 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold text-white line-clamp-2" title={book.title}>
                      {book.title}
                    </h3>
                    {book.genre && (
                      <span className="inline-flex shrink-0 items-center rounded-md bg-indigo-400/10 px-2 py-0.5 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-400/20">
                        {book.genre}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Autor: <span className="font-semibold text-slate-300">{book.author.name}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-500">
                    <div>📅 Año: {book.publishedYear || 'N/A'}</div>
                    <div>📄 Páginas: {book.pages || 'N/A'}</div>
                    <div className="col-span-2 truncate">🏷️ ISBN: {book.isbn || 'Sin ISBN'}</div>
                  </div>

                  <p className="text-sm text-slate-300 mt-4 line-clamp-3">
                    {book.description || 'Sin descripción disponible.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(book)}
                    className="inline-flex flex-1 items-center justify-center rounded-md bg-amber-500/10 py-1.5 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/20 hover:bg-amber-500/20 transition-all"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="inline-flex flex-1 items-center justify-center rounded-md bg-red-500/10 py-1.5 text-xs font-semibold text-red-400 ring-1 ring-inset ring-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition-colors"
              >
                ◀️ Anterior
              </button>
              <div className="text-sm text-slate-400">
                Página <span className="font-semibold text-white">{page}</span> de <span className="font-semibold text-white">{totalPages}</span>
              </div>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition-colors"
              >
                Siguiente ▶️
              </button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingBook ? 'Editar Libro' : 'Registrar Nuevo Libro'}
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
                  Título del Libro *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej. Cien años de soledad"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Autor *
                </label>
                <select
                  required
                  value={selectedAuthorId}
                  onChange={e => setSelectedAuthorId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="" disabled>Selecciona un autor...</option>
                  {authors.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Género
                  </label>
                  <select
                    value={genre}
                    onChange={e => setGenre(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Selecciona género...</option>
                    {defaultGenres.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={e => setIsbn(e.target.value)}
                    placeholder="Ej. 978-3-16-148410-0"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Año de Publicación
                  </label>
                  <input
                    type="number"
                    value={publishedYear}
                    onChange={e => setPublishedYear(e.target.value)}
                    placeholder="Ej. 1967"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Número de Páginas
                  </label>
                  <input
                    type="number"
                    value={pages}
                    onChange={e => setPages(e.target.value)}
                    placeholder="Ej. 417"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Resumen o sinopsis del libro..."
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
                  {submitting ? 'Guardando...' : 'Guardar Libro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
