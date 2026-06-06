'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

interface Book {
  id: string
  title: string
  description: string | null
  isbn: string | null
  publishedYear: number | null
  genre: string | null
  pages: number | null
}

interface Author {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  books: Book[]
}

interface AuthorStats {
  authorId: string
  authorName: string
  totalBooks: number
  firstBook: { title: string; year: number } | null
  latestBook: { title: string; year: number } | null
  averagePages: number
  genres: string[]
  longestBook: { title: string; pages: number } | null
  shortestBook: { title: string; pages: number } | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AuthorDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  // States
  const [author, setAuthor] = useState<Author | null>(null)
  const [stats, setStats] = useState<AuthorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit Author states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [nationality, setNationality] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [authorFormError, setAuthorFormError] = useState<string | null>(null)
  const [submittingAuthor, setSubmittingAuthor] = useState(false)

  // Add Book states
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false)
  const [bookTitle, setBookTitle] = useState('')
  const [bookDescription, setBookDescription] = useState('')
  const [bookIsbn, setBookIsbn] = useState('')
  const [bookPublishedYear, setBookPublishedYear] = useState('')
  const [bookGenre, setBookGenre] = useState('')
  const [bookPages, setBookPages] = useState('')
  const [bookFormError, setBookFormError] = useState<string | null>(null)
  const [submittingBook, setSubmittingBook] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch Author Details
      const authorRes = await fetch(`/api/authors/${id}`)
      if (!authorRes.ok) throw new Error('Error al obtener los detalles del autor')
      const authorData = await authorRes.json()
      setAuthor(authorData)

      // Fetch Author Stats
      const statsRes = await fetch(`/api/authors/${id}/stats`)
      if (!statsRes.ok) throw new Error('Error al obtener estadísticas del autor')
      const statsData = await statsRes.json()
      setStats(statsData)

      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const openEditAuthorModal = () => {
    if (!author) return
    setName(author.name)
    setEmail(author.email)
    setBio(author.bio || '')
    setNationality(author.nationality || '')
    setBirthYear(author.birthYear ? String(author.birthYear) : '')
    setAuthorFormError(null)
    setIsEditModalOpen(true)
  }

  const openAddBookModal = () => {
    setBookTitle('')
    setBookDescription('')
    setBookIsbn('')
    setBookPublishedYear('')
    setBookGenre('')
    setBookPages('')
    setBookFormError(null)
    setIsAddBookModalOpen(true)
  }

  const handleEditAuthorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthorFormError(null)
    setSubmittingAuthor(true)

    if (!name || !email) {
      setAuthorFormError('Nombre y email son requeridos')
      setSubmittingAuthor(false)
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
      const res = await fetch(`/api/authors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar autor')

      setIsEditModalOpen(false)
      fetchData()
    } catch (err: any) {
      setAuthorFormError(err.message)
    } finally {
      setSubmittingAuthor(false)
    }
  }

  const handleAddBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookFormError(null)
    setSubmittingBook(true)

    if (!bookTitle) {
      setBookFormError('El título del libro es requerido')
      setSubmittingBook(false)
      return
    }

    if (bookTitle.length < 3) {
      setBookFormError('El título debe tener al menos 3 caracteres')
      setSubmittingBook(false)
      return
    }

    const payload = {
      title: bookTitle,
      description: bookDescription || null,
      isbn: bookIsbn || null,
      publishedYear: bookPublishedYear ? parseInt(bookPublishedYear) : null,
      genre: bookGenre || null,
      pages: bookPages ? parseInt(bookPages) : null,
      authorId: id
    }

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar el libro')

      setIsAddBookModalOpen(false)
      fetchData()
    } catch (err: any) {
      setBookFormError(err.message)
    } finally {
      setSubmittingBook(false)
    }
  }

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este libro?')) return

    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar libro')
      }
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const defaultGenres = ['Novela', 'Fantasía', 'Drama', 'Ciencia Ficción', 'Terror', 'Historia', 'Poesía', 'Biografía', 'Ensayo']

  if (loading && !author) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 animate-pulse space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded-lg"></div>
        <div className="h-64 bg-slate-900 rounded-xl"></div>
        <div className="h-96 bg-slate-900 rounded-xl"></div>
      </div>
    )
  }

  if (error || !author) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-16 text-center">
        <span className="text-4xl">⚠️</span>
        <h2 className="mt-4 text-xl font-bold text-white">Error de carga</h2>
        <p className="mt-2 text-sm text-slate-500">{error || 'Autor no encontrado'}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
        >
          Volver al Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back to dashboard */}
      <button
        onClick={() => router.push('/')}
        className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white mb-6 group transition-colors"
      >
        <span className="mr-1 group-hover:-translate-x-1 transition-transform inline-block">◀</span>
        Volver a Autores
      </button>

      {/* Author Profile Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {author.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="rounded-md bg-slate-800 px-2 py-1">📧 {author.email}</span>
              {author.nationality && (
                <span className="rounded-md bg-slate-800 px-2 py-1">🌎 {author.nationality}</span>
              )}
              {author.birthYear && (
                <span className="rounded-md bg-slate-800 px-2 py-1">👶 Nacimiento: {author.birthYear}</span>
              )}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl pt-2">
              {author.bio || 'Este autor no tiene una biografía registrada.'}
            </p>
          </div>
          <button
            onClick={openEditAuthorModal}
            className="inline-flex items-center justify-center shrink-0 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/20 hover:bg-amber-500/20 transition-all"
          >
            ✏️ Editar Perfil
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      {stats && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Estadísticas del Autor</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Books */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Libros Publicados</p>
                <p className="mt-1 text-2xl font-bold text-white">{stats.totalBooks}</p>
              </div>
              <span className="text-3xl opacity-20">📚</span>
            </div>

            {/* Average Pages */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Promedio de Páginas</p>
                <p className="mt-1 text-2xl font-bold text-white">{stats.averagePages} págs.</p>
              </div>
              <span className="text-3xl opacity-20">📄</span>
            </div>

            {/* Unique Genres */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm flex items-center justify-between">
              <div className="max-w-[80%]">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Géneros Utilizados</p>
                <p className="mt-1 text-sm font-bold text-indigo-400 truncate">
                  {stats.genres.join(', ') || 'Ninguno'}
                </p>
              </div>
              <span className="text-3xl opacity-20">🏷️</span>
            </div>

            {/* Min/Max Years */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm lg:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Cronología de Publicación</p>
              <div className="mt-2 space-y-1 text-xs">
                {stats.firstBook ? (
                  <div className="text-slate-300">
                    🥇 Primer libro: <span className="font-semibold text-white">{stats.firstBook.title}</span> ({stats.firstBook.year})
                  </div>
                ) : (
                  <div className="text-slate-500">Sin registros de años</div>
                )}
                {stats.latestBook && (
                  <div className="text-slate-300">
                    🚀 Último libro: <span className="font-semibold text-white">{stats.latestBook.title}</span> ({stats.latestBook.year})
                  </div>
                )}
              </div>
            </div>

            {/* Longest/Shortest Books */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm sm:col-span-2 lg:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Extremos de Volumen</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 text-xs">
                {stats.longestBook ? (
                  <div className="text-slate-300 bg-slate-950/40 p-2 rounded-lg">
                    📈 Más extenso:
                    <div className="font-semibold text-white truncate mt-0.5">{stats.longestBook.title}</div>
                    <div className="text-slate-400">{stats.longestBook.pages} páginas</div>
                  </div>
                ) : (
                  <div className="text-slate-500 p-2">Sin datos de extensión</div>
                )}
                {stats.shortestBook && (
                  <div className="text-slate-300 bg-slate-950/40 p-2 rounded-lg">
                    📉 Más corto:
                    <div className="font-semibold text-white truncate mt-0.5">{stats.shortestBook.title}</div>
                    <div className="text-slate-400">{stats.shortestBook.pages} páginas</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Grid */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <h2 className="text-xl font-bold text-white">Libros del Autor</h2>
          <button
            onClick={openAddBookModal}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            ➕ Agregar Libro
          </button>
        </div>

        {author.books.length === 0 ? (
          <div className="text-center rounded-xl border border-dashed border-slate-800 py-16">
            <span className="text-3xl">📚</span>
            <h3 className="mt-4 text-base font-semibold text-slate-300">Este autor aún no tiene libros</h3>
            <p className="mt-1 text-xs text-slate-500">Registra su primera publicación directamente aquí.</p>
            <button
              onClick={openAddBookModal}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Agregar Libro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {author.books.map((book) => (
              <div
                key={book.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 hover:bg-slate-900 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base font-bold text-white truncate" title={book.title}>
                      {book.title}
                    </h3>
                    {book.genre && (
                      <span className="inline-flex shrink-0 items-center rounded-md bg-indigo-400/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400 ring-1 ring-inset ring-indigo-400/20">
                        {book.genre}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-slate-500">
                    <div>📅 Año: {book.publishedYear || 'N/A'}</div>
                    <div>📄 Páginas: {book.pages || 'N/A'}</div>
                    <div className="col-span-2 truncate">🏷️ ISBN: {book.isbn || 'Sin ISBN'}</div>
                  </div>

                  <p className="text-xs text-slate-300 mt-3 line-clamp-3">
                    {book.description || 'Sin descripción disponible.'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex justify-end">
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="inline-flex items-center justify-center rounded bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 ring-1 ring-inset ring-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    🗑️ Eliminar Libro
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Author Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 className="text-xl font-bold text-white">Editar Perfil del Autor</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditAuthorSubmit} className="space-y-4">
              {authorFormError && (
                <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-400">
                  ⚠️ {authorFormError}
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
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
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
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
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
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
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
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
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
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingAuthor}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {submittingAuthor ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {isAddBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 className="text-xl font-bold text-white">Agregar Libro al Autor</h2>
              <button
                onClick={() => setIsAddBookModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBookSubmit} className="space-y-4">
              {bookFormError && (
                <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-400">
                  ⚠️ {bookFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Título del Libro *
                </label>
                <input
                  type="text"
                  required
                  value={bookTitle}
                  onChange={e => setBookTitle(e.target.value)}
                  placeholder="Ej. Cien años de soledad"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Género
                  </label>
                  <select
                    value={bookGenre}
                    onChange={e => setBookGenre(e.target.value)}
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
                    value={bookIsbn}
                    onChange={e => setBookIsbn(e.target.value)}
                    placeholder="Ej. 978-3-16-148410-0"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
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
                    value={bookPublishedYear}
                    onChange={e => setBookPublishedYear(e.target.value)}
                    placeholder="Ej. 1967"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Número de Páginas
                  </label>
                  <input
                    type="number"
                    value={bookPages}
                    onChange={e => setBookPages(e.target.value)}
                    placeholder="Ej. 417"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={bookDescription}
                  onChange={e => setBookDescription(e.target.value)}
                  placeholder="Resumen o sinopsis del libro..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(false)}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingBook}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {submittingBook ? 'Guardando...' : 'Agregar Libro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
