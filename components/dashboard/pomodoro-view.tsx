'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Task, Profile, PomodoroSession, PomodoroType } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { updateTask } from '@/lib/actions/tasks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Timer, Play, Pause, RotateCcw, Coffee, Zap, Target, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface PomodoroViewProps {
  tasks: Task[]
  profile: Profile | null
  todaySessions: PomodoroSession[]
}

type TimerState = 'idle' | 'running' | 'paused'

export function PomodoroView({ tasks, profile, todaySessions }: PomodoroViewProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const workDuration = (profile?.pomodoro_duration || 25) * 60
  const shortBreakDuration = (profile?.short_break || 5) * 60
  const longBreakDuration = (profile?.long_break || 15) * 60

  const [timerType, setTimerType] = useState<PomodoroType>('work')
  const [timeLeft, setTimeLeft] = useState(workDuration)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [sessionsCompleted, setSessionsCompleted] = useState(
    todaySessions.filter(s => s.type === 'work').length
  )

  const selectedTask = tasks.find(t => t.id === selectedTaskId)

  const getDuration = useCallback((type: PomodoroType) => {
    switch (type) {
      case 'work': return workDuration
      case 'short_break': return shortBreakDuration
      case 'long_break': return longBreakDuration
    }
  }, [workDuration, shortBreakDuration, longBreakDuration])

  useEffect(() => {
    setTimeLeft(getDuration(timerType))
    setTimerState('idle')
  }, [timerType, getDuration])

  useEffect(() => {
    if (timerState !== 'running') return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleTimerComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerState])

  // Título da Aba dinâmico
  useEffect(() => {
      if(timerState === 'running') {
          document.title = `${formatTime(timeLeft)} - Focus OS`
      } else {
          document.title = 'Focus OS'
      }
  }, [timeLeft, timerState])

  async function handleTimerComplete() {
    setTimerState('idle')
    const audio = new Audio('/notification.mp3') // Certifique-se de ter esse arquivo em public/ ou remova
    audio.play().catch(() => {})

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('pomodoro_sessions').insert({
        user_id: user.id,
        task_id: selectedTaskId || null,
        duration_minutes: Math.round(getDuration(timerType) / 60),
        type: timerType,
      })
    }

    if (timerType === 'work') {
      const newCount = sessionsCompleted + 1
      setSessionsCompleted(newCount)

      if (selectedTaskId) {
        const task = tasks.find(t => t.id === selectedTaskId)
        if (task) {
          startTransition(async () => {
            await updateTask(selectedTaskId, {
              actual_minutes: (task.actual_minutes || 0) + (profile?.pomodoro_duration || 25)
            })
          })
        }
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f43f5e'],
      })

      toast.success('Ciclo de Foco concluído!', {
        description: `${newCount} sessões hoje. Ótimo trabalho!`,
      })

      if (newCount % 4 === 0) {
        setTimerType('long_break')
      } else {
        setTimerType('short_break')
      }
    } else {
      toast.success('Descanso finalizado!', { description: 'Bora voltar pro foco?' })
      setTimerType('work')
    }
    router.refresh()
  }

  function handleStart() { setTimerState('running') }
  function handlePause() { setTimerState('paused') }
  function handleReset() {
    setTimerState('idle')
    setTimeLeft(getDuration(timerType))
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((getDuration(timerType) - timeLeft) / getDuration(timerType)) * 100
  const isWork = timerType === 'work'

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-brand-violet to-brand-cyan bg-clip-text text-transparent inline-block">
              Modo Deep Work
          </h1>
          <p className="text-muted-foreground">Bloqueie distrações e foque no que importa.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TIMER PRINCIPAL */}
        <div className="lg:col-span-2 relative">
          {/* Fundo Glow */}
          <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-20 blur-3xl rounded-full transition-colors duration-700",
              isWork ? "from-brand-violet to-blue-600" : "from-emerald-500 to-green-600"
          )} />

          <div className="relative bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl flex flex-col items-center justify-center min-h-[500px]">
            
            {/* Seletor de Tipo */}
            <div className="flex justify-center gap-2 mb-10 p-1 bg-black/20 rounded-full backdrop-blur-md">
              <Button
                variant="ghost"
                size="sm"
                className={cn("rounded-full px-6 transition-all", timerType === 'work' && "bg-brand-violet text-white shadow-neon-violet")}
                onClick={() => setTimerType('work')}
                disabled={timerState === 'running'}
              >
                <Zap className="w-4 h-4 mr-2" /> Foco
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("rounded-full px-6 transition-all", timerType === 'short_break' && "bg-brand-emerald text-white shadow-neon-emerald")}
                onClick={() => setTimerType('short_break')}
                disabled={timerState === 'running'}
              >
                <Coffee className="w-4 h-4 mr-2" /> Curta
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("rounded-full px-6 transition-all", timerType === 'long_break' && "bg-blue-500 text-white shadow-lg")}
                onClick={() => setTimerType('long_break')}
                disabled={timerState === 'running'}
              >
                <Coffee className="w-4 h-4 mr-2" /> Longa
              </Button>
            </div>

            {/* Display do Timer */}
            <div className="relative mb-10 group cursor-default select-none">
              <div className={cn(
                'text-[8rem] leading-none font-bold tabular-nums tracking-tighter transition-all duration-300 drop-shadow-2xl',
                isWork ? 'text-white' : 'text-brand-emerald'
              )}>
                {formatTime(timeLeft)}
              </div>
              <div className={cn(
                  "absolute -inset-4 blur-2xl opacity-20 transition-all duration-1000 rounded-full",
                  timerState === 'running' && isWork ? "bg-brand-violet animate-pulse" : 
                  timerState === 'running' && !isWork ? "bg-brand-emerald animate-pulse" : "bg-transparent"
              )} />
            </div>

            {/* Controles */}
            <div className="flex gap-4 items-center">
               <Button 
                size="icon" 
                variant="outline" 
                onClick={handleReset} 
                className="h-12 w-12 rounded-full border-white/10 hover:bg-white/10"
               >
                   <RotateCcw className="w-5 h-5" />
               </Button>

               {timerState === 'running' ? (
                <Button 
                    size="lg" 
                    variant="outline"
                    onClick={handlePause}
                    className="h-16 px-8 rounded-full text-lg border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                >
                  <Pause className="w-6 h-6 mr-2 fill-current" /> Pausar
                </Button>
              ) : (
                <Button 
                    size="lg" 
                    onClick={handleStart}
                    className={cn(
                        "h-16 px-10 rounded-full text-lg shadow-xl transition-transform hover:scale-105 active:scale-95",
                        isWork ? "bg-brand-violet hover:bg-brand-violet/90 shadow-neon-violet" : "bg-brand-emerald hover:bg-brand-emerald/90 shadow-neon-emerald"
                    )}
                >
                  <Play className="w-6 h-6 mr-2 fill-current" /> Iniciar
                </Button>
              )}
            </div>
            
            {/* Barra de Progresso Discreta */}
            <Progress value={progress} className="absolute bottom-0 left-0 w-full h-1 rounded-b-3xl rounded-t-none bg-transparent" />
          </div>
        </div>

        {/* SIDEBAR DE STATUS */}
        <div className="space-y-6">
            
          {/* Tarefa Ativa */}
          <div className="bg-card/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Tarefa em Foco</h3>
            {timerType === 'work' && tasks.length > 0 ? (
                <div className="space-y-3">
                    <Select 
                        value={selectedTaskId || 'none'} 
                        onValueChange={setSelectedTaskId}
                        disabled={timerState === 'running'}
                    >
                    <SelectTrigger className="bg-black/20 border-white/10 h-12">
                        <SelectValue placeholder="O que vamos fazer agora?" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                        <SelectItem value="none">Sem tarefa específica</SelectItem>
                        {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                            {task.title}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    
                    {selectedTask && (
                        <div className="text-xs text-muted-foreground text-center">
                            Estimado: {selectedTask.estimated_minutes || 0}min • Real: {selectedTask.actual_minutes || 0}min
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center text-sm text-muted-foreground py-2">
                    {timerType === 'work' ? "Crie tarefas para selecionar aqui" : "Aproveite seu descanso!"}
                </div>
            )}
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card/40 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-md">
                <Target className="w-6 h-6 text-brand-violet mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{sessionsCompleted}</div>
                <div className="text-xs text-muted-foreground">Ciclos Hoje</div>
            </div>
            <div className="bg-card/40 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-md">
                <Timer className="w-6 h-6 text-brand-cyan mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{Math.round(sessionsCompleted * 25)}</div>
                <div className="text-xs text-muted-foreground">Minutos Focados</div>
            </div>
          </div>

          {/* Histórico Recente */}
          <div className="bg-card/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex-1">
             <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Timeline de Hoje</h3>
             <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {todaySessions.length > 0 ? (
                  todaySessions.slice().reverse().slice(0, 5).map((session, i) => (
                    <div key={session.id} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className={cn("w-2 h-2 rounded-full", session.type === 'work' ? "bg-brand-violet" : "bg-brand-emerald")} />
                        <span className="text-white font-medium">{session.type === 'work' ? 'Sessão de Foco' : 'Pausa'}</span>
                        <span className="ml-auto text-muted-foreground text-xs">{session.duration_minutes} min</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4 italic">
                    Seu histórico aparecerá aqui.
                  </p>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}