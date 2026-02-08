'use client'

import { useState } from 'react'
import type { Task } from '@/lib/types'
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths 
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

interface CalendarViewProps {
  tasks: Task[]
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  // Navegação
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDate(today)
  }

  // Geração do Grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  // Filtrar tarefas do dia selecionado
  const selectedDayTasks = tasks.filter(task => 
    selectedDate && task.due_date && isSameDay(new Date(task.due_date), selectedDate)
  )

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-10rem)] gap-6">
      
      {/* 1. O CALENDÁRIO VISUAL */}
      <div className="flex-1 bg-card/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-2xl flex flex-col">
        
        {/* Header do Calendário */}
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white capitalize flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-brand-violet" />
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday} className="mr-2 border-white/10 hover:bg-white/5">
                    Hoje
                </Button>
                <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-white/10">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-white/10">
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>
        </div>

        {/* Dias da Semana */}
        <div className="grid grid-cols-7 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    {day}
                </div>
            ))}
        </div>

        {/* Grid de Dias */}
        <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-1">
            {calendarDays.map((day, dayIdx) => {
                // Tarefas deste dia específico
                const dayTasks = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day))
                
                return (
                    <div 
                        key={day.toString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                            "relative p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-start justify-start group min-h-[80px]",
                            !isSameMonth(day, monthStart) ? "bg-black/20 border-transparent opacity-30 hover:opacity-50" : "bg-white/5 border-white/5 hover:border-brand-violet/50 hover:bg-white/10",
                            isSameDay(day, selectedDate!) && "ring-2 ring-brand-violet ring-offset-2 ring-offset-black bg-brand-violet/10",
                            isToday(day) && !isSameDay(day, selectedDate!) && "border-brand-cyan/50 shadow-[inset_0_0_10px_rgba(14,165,233,0.2)]"
                        )}
                    >
                        <span className={cn(
                            "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1",
                            isToday(day) ? "bg-brand-cyan text-white shadow-neon-cyan" : "text-muted-foreground group-hover:text-white"
                        )}>
                            {format(day, 'd')}
                        </span>

                        {/* Indicadores de Tarefa (Bolinhas) */}
                        <div className="flex flex-wrap gap-1 content-start w-full">
                            {dayTasks.slice(0, 4).map((task, i) => (
                                <HoverCard key={task.id} openDelay={200}>
                                    <HoverCardTrigger asChild>
                                        <div 
                                            className="w-full h-1.5 rounded-full mb-0.5 opacity-80 hover:opacity-100 transition-opacity"
                                            style={{ backgroundColor: task.category?.color || '#94a3b8' }}
                                        />
                                    </HoverCardTrigger>
                                    <HoverCardContent className="bg-slate-900 border-slate-700 w-auto p-2">
                                        <p className="text-xs font-bold text-white whitespace-nowrap">{task.title}</p>
                                    </HoverCardContent>
                                </HoverCard>
                            ))}
                            {dayTasks.length > 4 && (
                                <span className="text-[10px] text-muted-foreground pl-1">+{dayTasks.length - 4}</span>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
      </div>

      {/* 2. SIDEBAR DE DETALHES DO DIA (Agenda) */}
      <div className="w-full lg:w-80 bg-background/50 border-l border-white/5 p-6 flex flex-col">
         <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">
            {selectedDate ? format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
         </h3>

         <div className="space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 flex-1">
            {selectedDayTasks.length > 0 ? (
                selectedDayTasks.map(task => (
                    <div key={task.id} className="group flex items-start gap-3 p-3 rounded-xl bg-card/60 border border-white/5 hover:border-brand-violet/30 transition-all">
                         <div 
                            className="w-1 h-full min-h-[40px] rounded-full self-stretch" 
                            style={{ backgroundColor: task.category?.color || '#64748b' }} 
                         />
                         <div className="flex-1">
                             <h4 className={cn("text-sm font-medium text-white line-clamp-2", task.status === 'done' && "line-through text-muted-foreground")}>
                                 {task.title}
                             </h4>
                             <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                 <Clock className="w-3 h-3" />
                                 {task.due_date ? format(new Date(task.due_date), 'HH:mm') : 'Dia todo'}
                             </div>
                         </div>
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                             {/* Botão de ação rápida futura (ex: check) */}
                             <div className={cn("w-4 h-4 rounded-full border border-white/20", task.status === 'done' ? "bg-brand-emerald border-none" : "")} />
                         </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-10 opacity-50">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Dia livre! <br/> Nenhuma tarefa agendada.</p>
                </div>
            )}
         </div>
      </div>

    </div>
  )
}