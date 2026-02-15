import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Team, TeamRole } from '@/lib/types'
import type { LucideIcon } from 'lucide-react'
import { Users, Plus, Hash, Crown, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TeamsDialog } from '@/components/dashboard/teams-dialog'

type TeamWithRole = Team & { role: TeamRole }

const roleOrder: Record<TeamRole, number> = { owner: 0, admin: 1, member: 2 }

const roleConfig: Record<TeamRole, { label: string; className: string; Icon: LucideIcon }> = {
  owner: {
    label: 'Líder',
    className: 'border-brand-amber/50 text-brand-amber bg-brand-amber/10',
    Icon: Crown,
  },
  admin: {
    label: 'Admin',
    className: 'border-brand-cyan/50 text-brand-cyan bg-brand-cyan/10',
    Icon: Shield,
  },
  member: {
    label: 'Membro',
    className: 'border-white/20 text-white/80 bg-white/5',
    Icon: User,
  },
}

export default async function TeamsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select(
      `
      role,
      team:teams (
        id,
        name,
        description,
        owner_id,
        invite_code,
        created_at,
        updated_at
      )
    `,
    )
    .eq('user_id', user.id)

  const myTeams = (members ?? [])
    .map((member) =>
      member.team
        ? ({
            ...member.team,
            role: member.role,
          } as TeamWithRole)
        : null,
    )
    .filter(Boolean) as TeamWithRole[]

  myTeams.sort(
    (a, b) =>
      roleOrder[a.role] - roleOrder[b.role] || a.name.localeCompare(b.name),
  )

  const totalTeams = myTeams.length
  const ownedTeams = myTeams.filter((team) => team.role === 'owner').length
  const participatingTeams = totalTeams - ownedTeams

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-brand-violet to-brand-cyan bg-clip-text text-transparent inline-block">
            Esquadrões
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas equipes e colabore em projetos.
          </p>
        </div>

        <TeamsDialog
          trigger={
            <Button className="bg-brand-violet hover:bg-brand-violet/90 shadow-neon-violet">
              <Plus className="w-4 h-4 mr-2" /> Nova Equipe
            </Button>
          }
        />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Total
          </p>
          <p className="text-2xl font-semibold text-white">{totalTeams}</p>
          <p className="text-xs text-muted-foreground">Esquadrões ativos</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Você lidera
          </p>
          <p className="text-2xl font-semibold text-white">{ownedTeams}</p>
          <p className="text-xs text-muted-foreground">Projetos com você no comando</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Você participa
          </p>
          <p className="text-2xl font-semibold text-white">{participatingTeams}</p>
          <p className="text-xs text-muted-foreground">Times onde você contribui</p>
        </div>
      </div>

      {membersError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          Não foi possível carregar suas equipes agora. Tente novamente em
          instantes.
        </div>
      )}

      {/* Grid de Equipes */}
      {myTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myTeams.map((team) => {
            const roleMeta = roleConfig[team.role]

            return (
              <Card
                key={team.id}
                className="bg-card/40 border-white/10 backdrop-blur-sm hover:border-brand-violet/50 transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users className="w-24 h-24 text-brand-violet" />
                </div>

                <CardHeader className="space-y-2">
                  <div className="flex justify-between items-start gap-3">
                    <CardTitle className="text-xl text-white">
                      {team.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={roleMeta.className}
                    >
                      <roleMeta.Icon className="w-3 h-3 mr-1" />
                      {roleMeta.label}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {team.description || 'Sem descrição definida.'}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-black/20 p-2 rounded-lg border border-white/5">
                    <Hash className="w-4 h-4" />
                    Código:
                    <span className="font-mono text-white select-all tracking-widest">
                      {team.invite_code}
                    </span>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    variant="ghost"
                    className="w-full border border-white/10 hover:bg-white/5 group-hover:border-brand-violet/50"
                  >
                    Acessar QG
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Você ainda está solo
          </h3>
          <p className="text-muted-foreground mb-6">
            Crie uma equipe ou entre em uma para começar.
          </p>
          <TeamsDialog
            trigger={
              <Button variant="secondary">
                <Plus className="w-4 h-4 mr-2" /> Criar ou entrar
              </Button>
            }
          />
        </div>
      )}
    </div>
  )
}
