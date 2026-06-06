import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const genre = searchParams.get('genre')
    const authorName = searchParams.get('authorName')
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const sortBy = searchParams.get('sortBy')
    const order = searchParams.get('order')

    // Paginación
    const pageNumber = Math.max(parseInt(page || '1') || 1, 1)
    const limitNumber = Math.min(Math.max(parseInt(limit || '10') || 10, 1), 50)
    const skip = (pageNumber - 1) * limitNumber

    // Ordenamiento
    const allowedSortFields = ['title', 'publishedYear', 'createdAt']
    const sortField = allowedSortFields.includes(sortBy || '') ? (sortBy as string) : 'createdAt'
    const sortOrder = (order === 'asc' || order === 'desc') ? order : 'desc'

    // Construcción del filtro where
    const where: any = {}

    if (genre) {
      where.genre = genre
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      }
    }

    if (authorName) {
      where.author = {
        name: {
          contains: authorName,
          mode: 'insensitive'
        }
      }
    }

    // Contar total de registros filtrados
    const total = await prisma.book.count({ where })

    // Obtener los datos paginados
    const books = await prisma.book.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            nationality: true
          }
        }
      },
      orderBy: {
        [sortField]: sortOrder
      },
      skip,
      take: limitNumber
    })

    const totalPages = Math.ceil(total / limitNumber)
    const hasNext = pageNumber < totalPages
    const hasPrev = pageNumber > 1

    return NextResponse.json({
      data: books,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.max(totalPages, 1),
        hasNext,
        hasPrev
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al buscar libros' },
      { status: 500 }
    )
  }
}
