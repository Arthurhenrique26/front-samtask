'use client'

import { useMemo } from 'react'
import type { Task, PomodoroSession, Category } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Target, Zap, Clock, TrendingUp, Brain } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell
} from 'recharts'
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ReportsViewProps {
  tasks: Task[]
  sessions: PomodoroSession[]
  categories: Category[]
}

// CORREÇÃO AQUI: Adicionei " = []" para garantir que nunca seja undefined
export function ReportsView({ tasks = [], sessions = [], categories = [] }: ReportsViewProps) {
  
  // 1. CÁLCULO DE GAMIFICAÇÃO (XP)
  const stats = useMemo(() => {
    // Agora tasks nunca é undefined, então .filter() funciona sempre
    const completedTasks = tasks.filter(t => t.status === 'done')
    const totalSessions = sessions.length
    const totalFocusMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
    
    // Fórmula de XP: 100xp por tarefa, 50xp por sessão de foco
    const currentXP = (completedTasks.length * 100) + (totalSessions * 50)
    const currentLevel = Math.floor(currentXP / 1000) + 1
    const nextLevelXP = currentLevel * 1000
    const progressToNextLevel = ((currentXP % 1000) / 1000) * 100

    return { completedTasks, totalFocusMinutes, currentXP, currentLevel, nextLevelXP, progressToNextLevel }
  }, [tasks, sessions])

  // 2. DADOS PARA O GRÁFICO DE RADAR (Equilíbrio de Áreas)
  const radarData = useMemo(() => {
    if (categories.length === 0) return []
    
    return categories.map(cat => {
      const count = tasks.filter(t => 
        (t.category_id === cat.id || t.category?.id === cat.id) && 
        t.status === 'done'
      ).length
      
      return {
        subject: cat.name,
        A: count, 
        fullMark: 20, 
        color: cat.color
      }
    })
  }, [categories, tasks])

  // 3. DADOS PARA O GRÁFICO DE BARRAS (Foco Semanal)
  const weeklyData = useMemo(() => {
    const today = new Date()
    const start = startOfWeek(today, { weekStartsOn: 0 }) 
    const end = endOfWeek(today, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start, end })

    return days.map(day => {
      const minutes = sessions
        .filter(s => s.created_at && isSameDay(new Date(s.created_at), day))
        .reduce((acc, s) => acc + (s.duration_minutes || 0), 0)

      return {
        name: format(day, 'EEE', { locale: ptBR }),
        minutes: minutes,
        fullDate: format(day, 'dd/MM')
      }
    })
  }, [sessions])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER GAMIFICADO - HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900/50 via-slate-900/50 to-slate-900/50 border border-white/10 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-64 h-64 text-brand-violet" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            {/* Círculo de Nível */}
            <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-brand-violet border-r-brand-cyan animate-spin-slow" />
                <div className="absolute inset-2 rounded-full border-2 border-white/5" />
                <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">Nível</div>
                    <div className="text-4xl font-black text-white">{stats.currentLevel}</div>
                </div>
            </div>

            {/* Barra de XP e Stats */}
            <div className="flex-1 w-full space-y-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Status do Operador</h2>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>XP Atual: {stats.currentXP}</span>
                        <span>Próximo Nível: {stats.nextLevelXP}</span>
                    </div>
                    <Progress value={stats.progressToNextLevel} className="h-3 bg-black/40" />
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-black/20 rounded-xl p-3 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs">
                            <Target className="w-3 h-3" /> Tarefas
                        </div>
                        <div className="text-xl font-bold text-white">{stats.completedTasks.length}</div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs">
                            <Clock className="w-3 h-3" /> Foco Total
                        </div>
                        <div className="text-xl font-bold text-white">{(stats.totalFocusMinutes / 60).toFixed(1)}h</div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs">
                            <Zap className="w-3 h-3" /> Streak
                        </div>
                        <div className="text-xl font-bold text-brand-rose">12 Dias</div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* ÁREA DE GRÁFICOS */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Análise Tática</h3>
            <TabsList className="bg-black/20 border border-white/10">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="focus">Foco</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="overview" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* GRÁFICO DE RADAR (Equilíbrio) */}
            <Card className="bg-card/40 border-white/10 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Brain className="w-4 h-4 text-brand-violet" />
                        Mapa de Competências
                    </CardTitle>
                    <CardDescription>Distribuição de tarefas concluídas por área.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                            <Radar
                                name="Tarefas"
                                dataKey="A"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fill="#8b5cf6"
                                fillOpacity={0.4}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                itemStyle={{ color: '#8b5cf6' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* GRÁFICO DE BARRAS (Atividade Semanal) */}
            <Card className="bg-card/40 border-white/10 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="w-4 h-4 text-brand-emerald" />
                        Consistência Semanal
                    </CardTitle>
                    <CardDescription>Minutos de foco profundo nos últimos 7 dias.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
                            <XAxis 
                                dataKey="name" 
                                stroke="#475569" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                            />
                            <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                                {weeklyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.minutes > 0 ? '#10b981' : '#1e293b'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

        </TabsContent>

        <TabsContent value="focus">
            <Card className="bg-card/40 border-white/10 border-dashed p-10 flex flex-col items-center justify-center text-muted-foreground">
                <Target className="w-10 h-10 mb-4 opacity-50" />
                <p>Métricas detalhadas de sessão em breve...</p>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}