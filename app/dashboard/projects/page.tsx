import { createClient } from '@/lib/supabase/server'
import ProjectTree from '@/components/dashboard/project-tree' // Importe o componente novo
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Network } from 'lucide-react'

export default async function ProjectsTreePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Buscar categorias para montar os nós
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="h-full flex flex-col space-y-6">
      {!categories?.length ? (
        <Alert className="border-brand-violet/20 bg-brand-violet/5">
          <Network className="h-4 w-4 text-brand-violet" />
          <AlertTitle>Mapa Vazio</AlertTitle>
          <AlertDescription>
            Crie categorias (Matérias/Projetos) para vê-las conectadas aqui.
          </AlertDescription>
        </Alert>
      ) : (
        <ProjectTree categories={categories} />
      )}
    </div>
  )
}