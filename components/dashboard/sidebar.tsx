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
  LayoutDashboard, CheckSquare, Network, Map, CalendarRange, 
  Target, Settings, Zap, Columns, Timer, X
} from 'lucide-react'

interface DashboardSidebarProps {
  user: User
  profile: Profile | null
}

const navigation = [
  { name: 'Timeline', href: '/dashboard', icon: LayoutDashboard },
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    
    // Checa inicial
    checkMobile()
    
    // Adiciona listener para resize
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Abre se estiver clicado (isOpen) OU se o mouse estiver em cima (isHovered e não for mobile)
  // No mobile, hover não existe/não deve abrir sozinho
  const isVisible = isOpen || (isHovered && !isMobile)

  return (
    <>
      {/* 1. ZONA DE GATILHO (HOVER) - Apenas Desktop */}
      {!isMobile && (
        <div 
          className="fixed inset-y-0 left-0 w-6 z-40 bg-transparent"
          onMouseEnter={() => setIsHovered(true)}
        />
      )}

      {/* 2. OVERLAY ESCURO (Apenas Mobile quando aberto) */}
      {(isOpen && isMobile) && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={close}
        />
      )}

      {/* 3. A SIDEBAR FLUTUANTE */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-background/95 backdrop-blur-xl border-r border-white/10 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col h-[100dvh]",
          isVisible ? "translate-x-0" : "-translate-x-full"
        )}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        {/* Header da Sidebar */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-violet rounded-lg flex items-center justify-center shadow-neon-violet">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Focus OS</span>
          </div>
          {/* Botão fechar (visível apenas se aberto via clique) */}
          {isOpen && (
            <Button variant="ghost" size="icon" onClick={close} className="lg:hidden text-muted-foreground hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Scroll Area Principal */}
        <div className="flex-1 overflow-y-auto py-6 px-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          
          {/* Widget Streak */}
          <div className="mb-6 bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <span className="text-orange-500 animate-pulse">🔥</span>
                  <span className="text-sm font-medium text-white">12 Dias</span>
              </div>
              <span className="text-xs text-muted-foreground">Sequência</span>
          </div>

          <nav className="flex flex-1 flex-col space-y-1">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

              return (
                <Link key={item.name} href={item.href} onClick={() => { if(isMobile) close() }}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start text-sm font-medium mb-1 transition-all',
                      isActive 
                        ? 'bg-brand-violet/10 text-brand-violet border-l-2 border-brand-violet rounded-l-none' 
                        : 'text-muted-foreground hover:text-white hover:bg-white/5'
                    )}
                  >
                    <item.icon className={cn("mr-3 h-5 w-5", isActive && "text-brand-violet")} />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Fixo */}
        <div className="p-4 border-t border-white/5 bg-background/95">
            <Link href="/dashboard/settings" onClick={() => { if(isMobile) close() }}>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-white">
                    <Settings className="mr-3 h-5 w-5" />
                    Ajustes
                </Button>
            </Link>
        </div>
      </aside>
    </>
  )
}