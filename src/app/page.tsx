/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Trash2, Plus, UserIcon, CheckCircle, Circle, Edit2, Save, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Task {
  id: number
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
  userId: number
  user: {
    id: number
    name: string | null
    email: string
  }
}

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null) // Changed to string for Select component
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editingTaskTitle, setEditingTaskTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchTasks()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError("Failed to load users")
      console.error(err)
    }
  }

  const fetchTasks = async () => {
    try {
      const url = selectedUserId ? `/api/tasks?userId=${selectedUserId}` : "/api/tasks"
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      setTasks(data)
    } catch (err) {
      setError("Failed to load tasks")
      console.error(err)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [selectedUserId])

  const createUser = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault()
    if (!newUserEmail) {
      setError("Email is required to create a user.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newUserEmail, name: newUserName || null }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Failed to create user")
      }

      setNewUserEmail("")
      setNewUserName("")
      await fetchUsers()
    } catch (err: any) {
      setError(err.message || "Failed to create user")
      console.error(err)
    }
    setLoading(false)
  }

  const createTask = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault()
    if (!newTaskTitle || !selectedUserId) {
      setError("Task title and assigned user are required.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle, userId: Number(selectedUserId) }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Failed to create task")
      }

      setNewTaskTitle("")
      await fetchTasks()
    } catch (err: any) {
      setError(err.message || "Failed to create task")
      console.error(err)
    }
    setLoading(false)
  }

  const toggleTaskCompletion = async (taskId: number, completed: boolean) => {
    setError(null)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Failed to update task")
      }

      await fetchTasks()
    } catch (err: any) {
      setError(err.message || "Failed to update task")
      console.error(err)
    }
  }

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingTaskTitle(task.title)
  }

  const saveTaskEdit = async (taskId: number) => {
    if (!editingTaskTitle.trim()) {
      setError("Task title cannot be empty.")
      return
    }

    setError(null)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTaskTitle }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Failed to update task")
      }

      setEditingTaskId(null)
      setEditingTaskTitle("")
      await fetchTasks()
    } catch (err: any) {
      setError(err.message || "Failed to update task")
      console.error(err)
    }
  }

  const cancelEdit = () => {
    setEditingTaskId(null)
    setEditingTaskTitle("")
  }

  const deleteTask = async (taskId: number) => {
    setError(null)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Failed to delete task")
      }

      await fetchTasks()
    } catch (err: any) {
      setError(err.message || "Failed to delete task")
      console.error(err)
    }
  }

  const completedTasks = tasks.filter((task) => task.completed)
  const pendingTasks = tasks.filter((task) => !task.completed)

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 mb-10 text-center drop-shadow-md">
          Task Management System
        </h1>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/20 backdrop-blur-sm border-red-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Management */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl shadow-lg dark:bg-gray-800/20 dark:border-gray-700/30">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-gray-50">
                <UserIcon className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-3">
                <Input
                  type="email"
                  placeholder="Email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="bg-white/50 border-white/40 focus:ring-purple-500 dark:bg-gray-700/50 dark:border-gray-600/40 dark:text-gray-50"
                  onKeyDown={(e) => e.key === "Enter" && createUser(e)}
                />
                <Input
                  type="text"
                  placeholder="Name (optional)"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="bg-white/50 border-white/40 focus:ring-purple-500 dark:bg-gray-700/50 dark:border-gray-600/40 dark:text-gray-50"
                  onKeyDown={(e) => e.key === "Enter" && createUser(e)}
                />
                <Button
                  onClick={createUser}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-800 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>

              <div className="space-y-2">
                <Button
                  variant={selectedUserId === null ? "secondary" : "ghost"}
                  onClick={() => setSelectedUserId(null)}
                  className={`w-full justify-start text-left ${
                    selectedUserId === null
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200"
                      : "hover:bg-white/30 dark:hover:bg-gray-700/30"
                  }`}
                >
                  All Users
                </Button>
                {users.map((user) => (
                  <Button
                    key={user.id}
                    variant={selectedUserId === String(user.id) ? "secondary" : "ghost"}
                    onClick={() => setSelectedUserId(String(user.id))}
                    className={`w-full justify-start text-left h-auto py-2 ${
                      selectedUserId === String(user.id)
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200"
                        : "hover:bg-white/30 dark:hover:bg-gray-700/30"
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <div className="font-medium text-gray-800 dark:text-gray-100">{user.name || "Unnamed User"}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Task Management */}
          <div className="lg:col-span-2 space-y-8">
            {/* Add Task Form */}
            <Card className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl shadow-lg dark:bg-gray-800/20 dark:border-gray-700/30">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-50">Add New Task</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={selectedUserId || ""} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white/50 border-white/40 focus:ring-purple-500 dark:bg-gray-700/50 dark:border-gray-600/40 dark:text-gray-50">
                      <SelectValue placeholder="Select User" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 backdrop-blur-md dark:bg-gray-800/90">
                      {users.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="text"
                    placeholder="Task title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 bg-white/50 border-white/40 focus:ring-purple-500 dark:bg-gray-700/50 dark:border-gray-600/40 dark:text-gray-50"
                    onKeyDown={(e) => e.key === "Enter" && createTask(e)}
                  />
                  <Button
                    onClick={createTask}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pending Tasks */}
            <Card className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl shadow-lg dark:bg-gray-800/20 dark:border-gray-700/30">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-50">Pending Tasks ({pendingTasks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTasks.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No pending tasks</p>
                  ) : (
                    pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border border-white/40 rounded-lg bg-white/30 dark:bg-gray-700/30 dark:border-gray-600/40"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTaskCompletion(task.id, task.completed)}
                          className="text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors flex-shrink-0"
                        >
                          <Circle className="w-5 h-5" />
                        </Button>

                        {editingTaskId === task.id ? (
                          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                            <Input
                              type="text"
                              value={editingTaskTitle}
                              onChange={(e) => setEditingTaskTitle(e.target.value)}
                              className="flex-1 px-2 py-1 bg-white/50 border-white/40 focus:ring-purple-500 dark:bg-gray-600/50 dark:border-gray-500/40 dark:text-gray-50"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveTaskEdit(task.id)
                                if (e.key === "Escape") cancelEdit()
                              }}
                              autoFocus
                            />
                            <div className="flex gap-1 mt-2 sm:mt-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => saveTaskEdit(task.id)}
                                className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-500"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={cancelEdit}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 w-full">
                            <div className="font-medium text-gray-800 dark:text-gray-100">{task.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Assigned to: {task.user.name || task.user.email}
                            </div>
                          </div>
                        )}

                        {editingTaskId !== task.id && (
                          <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditingTask(task)}
                              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white/90 backdrop-blur-md dark:bg-gray-800/90">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-gray-900 dark:text-gray-50">
                                    Are you absolutely sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                                    This action cannot be undone. This will permanently delete your task and remove its
                                    data from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-50">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteTask(task.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Completed Tasks */}
            <Card className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl shadow-lg dark:bg-gray-800/20 dark:border-gray-700/30">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-50">
                  Completed Tasks ({completedTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedTasks.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No completed tasks</p>
                  ) : (
                    completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border border-white/40 rounded-lg bg-white/30 dark:bg-gray-700/30 dark:border-gray-600/40"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTaskCompletion(task.id, task.completed)}
                          className="text-green-600 hover:text-gray-600 dark:text-green-400 dark:hover:text-gray-400 transition-colors flex-shrink-0"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </Button>
                        <div className="flex-1 w-full">
                          <div className="font-medium line-through text-gray-600 dark:text-gray-300">{task.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Completed by: {task.user.name || task.user.email}
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors flex-shrink-0 mt-2 sm:mt-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white/90 backdrop-blur-md dark:bg-gray-800/90">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-900 dark:text-gray-50">
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                                This action cannot be undone. This will permanently delete your task and remove its data
                                from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-50">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTask(task.id)}
                                className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
