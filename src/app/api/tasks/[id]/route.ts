import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { UpdateTaskRequest, TaskResponse, ErrorResponse, SuccessResponse } from '@/types'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<TaskResponse | ErrorResponse>> {
  try {
    const { id } = await params
    const { completed, title }: UpdateTaskRequest = await req.json()
    
    const updateData: Partial<UpdateTaskRequest> = {}
    if (completed !== undefined) updateData.completed = completed
    if (title !== undefined) updateData.title = title

    const task = await prisma.task.update({
      where: { id: Number(id) },
      data: updateData,
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
    return NextResponse.json(task)
  } catch {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const { id } = await params
    await prisma.task.delete({
      where: { id: Number(id) }
    })
    return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}