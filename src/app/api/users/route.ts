import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { CreateUserRequest, UserResponse, ErrorResponse } from '@/types'

export async function GET(): Promise<NextResponse<UserResponse[] | ErrorResponse>> {
    console.log('GET /api/users called')
    try {
        const users = await prisma.user.findMany({
            include: {
                tasks: true
            }
        })
        console.log('Fetched users:', users)
        return NextResponse.json(users)
    } catch (error) {
        console.error('Failed to fetch users:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}

export async function POST(req: Request): Promise<NextResponse<UserResponse | ErrorResponse>> {
    console.log('POST /api/users called')
    try {
        const { email, name }: CreateUserRequest = await req.json()
        console.log('Creating user with:', { email, name })
        const user = await prisma.user.create({
            data: { email, name }
        })
        console.log('Created user:', user)
        return NextResponse.json(user, { status: 201 })
    } catch (error) {
        console.error('Failed to create user:', error)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
}

export async function DELETE(req: Request): Promise<NextResponse<Record<string, never> | ErrorResponse>> {
    console.log('DELETE /api/users called')
    try {
        const { id } = await req.json()
        console.log('Deleting user with id:', id)
        await prisma.user.delete({ where: { id } })
        console.log('Deleted user with id:', id)
        return NextResponse.json({}, { status: 204 })
    } catch (error) {
        console.error('Failed to delete user:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}