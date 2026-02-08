import React from "react"
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Toaster } from '@/components/ui/sonner'
import { SidebarProvider } from '@/components/dashboard/sidebar-context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background relative">
        {/* A Sidebar agora é "flutuante", não ocupa espaço no fluxo */}
        <DashboardSidebar user={user} profile={profile} />
        
        {/* Conteúdo principal ocupa 100% da tela sempre */}
        <div className="w-full transition-all duration-300">
          <DashboardHeader user={user} profile={profile} />
          <main className="p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}