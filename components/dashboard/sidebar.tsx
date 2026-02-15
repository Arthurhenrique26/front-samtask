'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/dashboard/sidebar-context'
import {
  LayoutDashboard,
  CheckSquare,
  Network,
  Map,
  CalendarRange,
  Target,
  Settings,
  Zap,
  Columns,
  Timer,
  X,
  Users,
  Flame,
} from 'lucide-react'

interface DashboardSidebarProps {
  user: User
  profile: Profile | null
}

const navigation = [
  { name: 'Timeline', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Equipes', href: '/dashboard/teams', icon: Users },
  { name: 'Calendário Master', href: '/dashboard/calendar', icon: CalendarRange },
  { name: 'Roadmap', href: '/dashboard/roadmap', icon: Map },
  { name: 'Árvore de Projetos', href: '/dashboard/projects', icon: Network },
  { name: 'Quadro Kanban', href: '/dashboard/kanban', icon: Columns },
  { name: 'Minhas Tarefas', href: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Modo Foco', href: '/dashboard/pomodoro', icon: Timer },
  { name: 'Performance', href: '/dashboard/reports', icon: Target },
]

export function DashboardSidebar({ user, profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()
  const [isHovered, setIsHovered] = useState(false)

  // CORREÇÃO DE HIDRATAÇÃO: Estado para controlar Mobile
  // Começa como false para evitar mismatch com o servidor
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check inicial
    const checkMobile = () => window.innerWidth < 1024
    setIsMobile(checkMobile())

    // Listener para resize
    const handleResize = () => setIsMobile(checkMobile())
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Reseta hover ao mudar para mobile para evitar estados presos
  useEffect(() => {
    if (isMobile) {
      setIsHovered(false)
    }
  }, [isMobile])

  // Lógica de Visibilidade:
  // - Mobile: Abre APENAS se isOpen for true (clique no burguer)
  // - Desktop: Abre se isOpen for true OU se o mouse estiver em cima (Hover)
  const isVisible = isOpen || (!isMobile && isHovered)

  return (
    <>
      {/* 1. ZONA DE GATILHO (HOVER) - Apenas Desktop */}
      {/* Faixa invisível na esquerda para detectar o mouse se aproximando */}
      {!isMobile && (
        <div
          className="fixed inset-y-0 left-0 w-6 z-40 bg-transparent"
          onMouseEnter={() => setIsHovered(true)}
        />
      )}

      {/* 2. OVERLAY ESCURO (Apenas Mobile quando aberto) */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* 3. A SIDEBAR FLUTUANTE */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-background/95 backdrop-blur-xl border-r border-white/10 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col h-[100dvh]',
          isVisible ? 'translate-x-0' : '-translate-x-full',
        )}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        aria-label="Menu lateral"
      >
        {/* Header da Sidebar */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-violet rounded-lg flex items-center justify-center shadow-neon-violet">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Focus OS</span>
          </div>
          
          {/* Botão fechar (visível apenas no mobile quando aberto) */}
          {isOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              className="lg:hidden text-muted-foreground hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Scroll Area Principal */}
        <div className="flex-1 overflow-y-auto py-6 px-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {/* Widget Streak */}
          <div className="mb-6 bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500 animate-pulse fill-orange-500/20" />
              <span className="text-sm font-medium text-white">12 dias</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Sequência</span>
          </div>

          <nav className="flex flex-1 flex-col space-y-1" aria-label="Navegação principal">
            {navigation.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    // Fecha a sidebar ao clicar em um link APENAS no mobile
                    if (isMobile) close()
                  }}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start text-sm font-medium mb-1 transition-all duration-200',
                      isActive
                        ? 'bg-brand-violet/10 text-brand-violet border-l-2 border-brand-violet rounded-l-none'
                        : 'text-muted-foreground hover:text-white hover:bg-white/5',
                    )}
                  >
                    <item.icon className={cn('mr-3 h-5 w-5 transition-colors', isActive ? 'text-brand-violet' : 'text-muted-foreground group-hover:text-white')} />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Fixo */}
        <div className="p-4 border-t border-white/5 bg-background/95 backdrop-blur-xl">
          <Link
            href="/dashboard/settings"
            onClick={() => {
              if (isMobile) close()
            }}
          >
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings className="mr-3 h-5 w-5" />
              Ajustes
            </Button>
          </Link>
        </div>
      </aside>
    </>
  )
}