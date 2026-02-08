import { createClient } from '@/lib/supabase/server'
import { TimelineView } from '@/components/dashboard/timeline-view' // Importe o novo componente
import { EmotionalCheckinPrompt } from '@/components/dashboard/emotional-checkin-prompt'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Buscar tarefas (com filtro para não mostrar concluídas muito antigas se quiser)
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`*, category:categories(*)`)
    .eq('user_id', user.id)
    .order('due_date', { ascending: true }) // Importante para a timeline

  // Check-in emocional logic (mantém igual)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const { data: todayCheckin } = await supabase
    .from('emotional_checkins')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
    .single()

  return (
    <div className="space-y-8 pb-20">
      {/* Header da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Foco de Hoje</h1>
          <p className="text-muted-foreground">Sua trilha de alta performance para hoje.</p>
        </div>
        <Button className="bg-brand-violet hover:bg-brand-violet/90 shadow-neon-violet transition-all">
          <Plus className="w-4 h-4 mr-2" /> Nova Tarefa
        </Button>
      </div>

      {!todayCheckin && <EmotionalCheckinPrompt />}
      
      {/* A Nova Timeline Vertical */}
      <TimelineView tasks={tasks || []} />
    </div>
  )
}