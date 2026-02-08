'use client'

import React, { useState, useTransition } from 'react'
import type { Task, Category, TaskStatus } from '@/lib/types'
import { updateTask, deleteTask } from '@/lib/actions/tasks'
import { TaskEditDialog } from './task-edit-dialog'
import { QuickAddTask } from './quick-add-task'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Kanban, Clock, Calendar, MoreHorizontal, Pencil, Trash2, GripVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface KanbanViewProps {
  tasks: Task[]
  categories: Category[]
}

const columns: { id: TaskStatus; title: string; color: string; border: string }[] = [
  { id: 'todo', title: 'A Fazer', color: 'bg-slate-500/10', border: 'border-slate-500/20' },
  { id: 'in_progress', title: 'Em Foco', color: 'bg-brand-violet/10', border: 'border-brand-violet/20' },
  { id: 'done', title: 'Concluído', color: 'bg-brand-emerald/10', border: 'border-brand-emerald/20' },
]

export function KanbanView({ tasks, categories }: KanbanViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isPending, startTransition] = useTransition()
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  function handleDragStart(e: React.DragEvent, task: Task) {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    // Hack para esconder a imagem fantasma padrão se quiser customizar, ou deixa padrão
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e: React.DragEvent, newStatus: TaskStatus) {
    e.preventDefault()
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    startTransition(async () => {
      const result = await updateTask(draggedTask.id, { status: newStatus })
      
      if (result.error) {
        toast.error('Erro ao mover tarefa')
        return
      }

      if (newStatus === 'done') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#0ea5e9', '#10b981', '#f59e0b'],
        })
        toast.success('Tarefa concluída!')
      } else {
        toast.success('Tarefa movida!')
      }
      setDraggedTask(null)
    })
  }

  function handleDeleteTask(taskId: string) {
    startTransition(async () => {
      const result = await deleteTask(taskId)
      if (result.error) {
        toast.error('Erro ao excluir tarefa')
        return
      }
      toast.success('Tarefa excluída')
    })
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Kanban className="w-6 h-6 text-brand-violet" />
            Fluxo Kanban
          </h1>
          <p className="text-muted-foreground">Arraste para gerenciar o fluxo de trabalho.</p>
        </div>
      </div>

      <div className="shrink-0">
        <QuickAddTask categories={categories} />
      </div>

      {/* Grid do Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id)

          return (
            <div
              key={column.id}
              className={cn(
                'rounded-xl p-4 min-h-[500px] h-full flex flex-col backdrop-blur-sm border transition-colors',
                column.color,
                column.border
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground tracking-wide flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", 
                    column.id === 'todo' ? "bg-slate-400" :
                    column.id === 'in_progress' ? "bg-brand-violet shadow-[0_0_8px_var(--brand-violet)]" :
                    "bg-brand-emerald shadow-[0_0_8px_var(--brand-emerald)]"
                  )} />
                  {column.title}
                </h3>
                <Badge variant="outline" className="rounded-full border-white/10 bg-black/20 text-xs">
                  {columnTasks.length}
                </Badge>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={cn(
                      'group relative rounded-xl border p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg cursor-grab active:cursor-grabbing',
                      'bg-card/80 border-white/5 backdrop-blur-md',
                      task.priority === 'urgent' ? 'border-l-4 border-l-brand-rose hover:shadow-neon-rose/20' : 
                      task.priority === 'high' ? 'border-l-4 border-l-orange-500 hover:shadow-orange-500/20' :
                      'hover:border-brand-violet/50 hover:shadow-neon-violet/20',
                      isPending && draggedTask?.id === task.id && 'opacity-40 rotate-2 scale-95'
                    )}
                  >
                    {/* Header do Card */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        {task.category && (
                          <span 
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: task.category.color }}
                          >
                            {task.category.name}
                          </span>
                        )}
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10">
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-950 border-white/10">
                                <DropdownMenuItem onClick={() => setEditingTask(task)} className="focus:bg-white/10 cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem 
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-destructive focus:bg-destructive/10 cursor-pointer"
                                >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <h4 className={cn(
                      'font-medium text-sm text-foreground leading-snug',
                      task.status === 'done' && 'line-through text-muted-foreground'
                    )}>
                      {task.title}
                    </h4>

                    {/* Footer do Card */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {task.due_date && (
                                <span className={cn("flex items-center gap-1", 
                                    new Date(task.due_date) < new Date() && task.status !== 'done' ? "text-brand-rose font-bold animate-pulse" : ""
                                )}>
                                    <Calendar className="w-3 h-3" />
                                    {new Date(task.due_date).toLocaleDateString('pt-BR').slice(0, 5)}
                                </span>
                            )}
                        </div>
                        
                        {/* Indicador de Prioridade (Bolinha) */}
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            task.priority === 'urgent' ? "bg-brand-rose shadow-[0_0_5px_var(--brand-rose)]" :
                            task.priority === 'high' ? "bg-orange-500" :
                            task.priority === 'medium' ? "bg-yellow-500" :
                            "bg-slate-600"
                        )} title={`Prioridade: ${task.priority}`} />
                    </div>
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-muted-foreground/50 text-sm">
                    <GripVertical className="w-6 h-6 mb-2 opacity-50" />
                    Solte tarefas aqui
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <TaskEditDialog
        task={editingTask}
        categories={categories}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      />
    </div>
  )
}