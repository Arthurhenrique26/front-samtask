export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type PomodoroType = 'work' | 'short_break' | 'long_break'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  daily_goal: number
  pomodoro_duration: number
  short_break: number
  long_break: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  created_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  category_id: string | null
  parent_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  estimated_minutes: number | null
  actual_minutes: number
  is_recurring: boolean
  recurrence_pattern: string | null
  position: number
  completed_at: string | null
  created_at: string
  updated_at: string
  // Joined data
  category?: Category | null
  tags?: Tag[]
  subtasks?: Task[]
}

export interface TaskTag {
  task_id: string
  tag_id: string
}

export interface PomodoroSession {
  id: string
  user_id: string
  task_id: string | null
  duration_minutes: number
  type: PomodoroType
  created_at: string   // <--- ADICIONADO AQUI PARA CORRIGIR O ERRO
  completed_at?: string
}

export interface EmotionalCheckin {
  id: string
  user_id: string
  mood: number
  energy: number
  note: string | null
  created_at: string
}

// View types
export type ViewType = 'list' | 'kanban' | 'calendar'

// Filter types
export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  category_id?: string
  tag_ids?: string[]
  search?: string
  due_date_from?: string
  due_date_to?: string
  is_today?: boolean
}

export interface TaskSort {
  field: 'due_date' | 'priority' | 'status' | 'created_at' | 'position'
  direction: 'asc' | 'desc'
}