'use client'

import { Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TimelineViewProps {
  tasks: Task[]
}

export function TimelineView({ tasks }: TimelineViewProps) {
  // Ordenar por horário (assumindo que dueDate tem hora, ou usando ordem de criação)
  const sortedTasks = [...tasks].sort((a, b) => {
    return new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime()
  })

  return (
    <div className="relative py-10 max-w-4xl mx-auto px-4">
      {/* Linha Central Neon */}
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] timeline-line-gradient transform md:-translate-x-1/2" />

      <div className="space-y-12">
        {sortedTasks.map((task, index) => {
          const isLeft = index % 2 === 0
          const date = task.due_date ? new Date(task.due_date) : new Date()
          const timeString = format(date, 'HH:mm')
          const isDone = task.status === 'done'

          return (
            <div key={task.id} className={cn(
              "relative flex flex-col md:flex-row items-center justify-between w-full",
              isLeft ? "md:flex-row-reverse" : ""
            )}>
              
              {/* Espaçador para desktop */}
              <div className="hidden md:block w-5/12" />

              {/* Nó da Timeline (Bolinha) */}
              <div className={cn(
                "absolute left-4 md:left-1/2 transform -translate-x-[50%] flex items-center justify-center w-8 h-8 rounded-full border-2 z-10 transition-all duration-300 bg-background",
                isDone ? "border-brand-emerald shadow-neon-emerald" : "border-brand-violet shadow-neon-violet"
              )}>
                {isDone ? (
                  <CheckCircle2 size={16} className="text-brand-emerald" />
                ) : (
                  <div className="w-2.5 h-2.5 bg-brand-violet rounded-full animate-pulse" />
                )}
              </div>

              {/* Card da Tarefa */}
              <div className={cn(
                "w-[calc(100%-3rem)] md:w-5/12 ml-12 md:ml-0 group cursor-pointer",
                // Se for mobile, margem sempre na esquerda. Desktop alterna.
              )}>
                <div className={cn(
                  "relative p-5 rounded-xl border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1",
                  task.priority === 'urgent' 
                    ? "border-brand-rose/50 hover:shadow-neon-rose" 
                    : "border-border hover:border-brand-violet/50 hover:shadow-neon-violet"
                )}>
                  
                  {/* Badge de Horário Flutuante */}
                  <div className="absolute -top-3 right-4 px-2 py-0.5 bg-background border border-border rounded-full flex items-center gap-1 text-xs text-muted-foreground shadow-sm">
                    <Clock size={10} />
                    {timeString}
                  </div>

                  {/* Categoria */}
                  {task.category && (
                    <span 
                      className="text-[10px] uppercase tracking-wider font-bold mb-1 block"
                      style={{ color: task.category.color }}
                    >
                      {task.category.name}
                    </span>
                  )}

                  <h3 className={cn(
                    "text-lg font-semibold text-foreground leading-tight",
                    isDone && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </h3>

                  {/* Micro Progresso (Visual) */}
                  <div className="mt-4 flex items-center justify-between">
                     <div className="flex gap-1">
                        {/* Simulando passos - depois ligamos ao backend real */}
                        {[1, 2, 3].map(step => (
                           <div key={step} className={cn(
                             "w-6 h-1 rounded-full",
                             isDone || step === 1 ? "bg-brand-violet" : "bg-muted"
                           )} />
                        ))}
                     </div>
                     <Badge variant="outline" className="border-border text-xs font-normal opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver detalhes <ArrowRight size={10} className="ml-1" />
                     </Badge>
                  </div>

                </div>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}