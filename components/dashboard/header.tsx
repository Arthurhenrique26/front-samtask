'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, Settings, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSidebar } from '@/components/dashboard/sidebar-context' // Importe o contexto

interface DashboardHeaderProps {
  user: User
  profile: Profile | null
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toggle } = useSidebar() // Usa a função toggle do nosso contexto

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Erro ao sair')
      return
    }
    router.push('/auth/login')
    router.refresh()
  }

  const userInitials = (profile?.full_name || user.email || 'U').substring(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/5 bg-background/60 px-4 shadow-sm backdrop-blur-xl sm:gap-x-6 sm:px-6 lg:px-8">
      
      {/* Botão Menu Burguer (Agora visível SEMPRE e controla a Sidebar) */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-muted-foreground hover:text-white"
        onClick={toggle}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Alternar Menu</span>
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-offset-background hover:bg-white/5 focus:ring-0">
              <Avatar className="h-9 w-9 border border-white/10 transition-transform hover:scale-105">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                <AvatarFallback className="bg-brand-violet/20 text-brand-violet font-bold">
                    {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-white/10 text-foreground">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-white">{profile?.full_name || 'Usuário'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}