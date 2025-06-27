import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { CreateTaskRequest, TaskResponse, ErrorResponse } from '@/types'

export async function GET(req: Request): Promise<NextResponse<TaskResponse[] | ErrorResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    const tasks = await prisma.task.findMany({
      where: userId ? { userId: Number(userId) } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(tasks)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: Request): Promise<NextResponse<TaskResponse | ErrorResponse>> {
  try {
    const { title, userId }: CreateTaskRequest = await req.json()
    
    if (!title || !userId) {
      return NextResponse.json({ error: 'Title and userId are required' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: { 
        title,
        userId: Number(userId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    return NextResponse.json(task, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}