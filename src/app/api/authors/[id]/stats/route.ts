import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        books: true
      }
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    const books = author.books

    let firstBook: { title: string, year: number } | null = null
    let latestBook: { title: string, year: number } | null = null
    let longestBook: { title: string, pages: number } | null = null
    let shortestBook: { title: string, pages: number } | null = null
    let averagePages = 0
    const genres: string[] = []

    // Filtrar libros con año publicado válido
    const booksWithYear = books.filter(b => b.publishedYear !== null)
    if (booksWithYear.length > 0) {
      let minBook = booksWithYear[0]
      let maxBook = booksWithYear[0]
      for (const b of booksWithYear) {
        if (b.publishedYear! < minBook.publishedYear!) minBook = b
        if (b.publishedYear! > maxBook.publishedYear!) maxBook = b
      }
      firstBook = { title: minBook.title, year: minBook.publishedYear! }
      latestBook = { title: maxBook.title, year: maxBook.publishedYear! }
    }

    // Filtrar libros con páginas válidas
    const booksWithPages = books.filter(b => b.pages !== null)
    if (booksWithPages.length > 0) {
      let sumPages = 0
      let maxPageBook = booksWithPages[0]
      let minPageBook = booksWithPages[0]
      for (const b of booksWithPages) {
        sumPages += b.pages!
        if (b.pages! > maxPageBook.pages!) maxPageBook = b
        if (b.pages! < minPageBook.pages!) minPageBook = b
      }
      averagePages = Math.round(sumPages / booksWithPages.length)
      longestBook = { title: maxPageBook.title, pages: maxPageBook.pages! }
      shortestBook = { title: minPageBook.title, pages: minPageBook.pages! }
    }

    // Obtener géneros únicos
    const uniqueGenres = new Set<string>()
    for (const b of books) {
      if (b.genre && b.genre.trim() !== '') {
        uniqueGenres.add(b.genre.trim())
      }
    }

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks: books.length,
      firstBook,
      latestBook,
      averagePages,
      genres: Array.from(uniqueGenres),
      longestBook,
      shortestBook
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del autor' },
      { status: 500 }
    )
  }
}
