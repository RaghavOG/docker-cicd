// Types based on Prisma schema
export interface User {
  id: number
  email: string
  name: string | null
  tasks?: Task[]
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: number
  title: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
  userId: number
  user?: User
}

// API Request/Response types
export interface CreateUserRequest {
  email: string
  name?: string
}

export interface CreateTaskRequest {
  title: string
  userId: number
}

export interface UpdateTaskRequest {
  title?: string
  completed?: boolean
}

export interface UserResponse extends User {
  tasks?: Task[]
}

export interface TaskResponse extends Omit<Task, 'user'> {
  user?: {
    id: number
    name: string | null
    email: string
  }
}

// Error response type
export interface ErrorResponse {
  error: string
}

// Success response type
export interface SuccessResponse {
  message: string
}
