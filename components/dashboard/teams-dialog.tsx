'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createTeam, joinTeam, type TeamActionState } from '@/lib/actions/teams'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Hash, Loader2, LogIn, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type TeamsDialogProps = {
  trigger: React.ReactNode
}

type SubmitButtonProps = Omit<React.ComponentProps<typeof Button>, 'type'> & {
  icon?: React.ReactNode
}

const initialState: TeamActionState = { status: 'idle' }

function SubmitButton({
  className,
  icon,
  children,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className={className}
      disabled={pending || disabled}
      {...props}
    >
      <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      </span>
      {children}
    </Button>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-400">{message}</p>
}

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-100">
      {message}
    </div>
  )
}

function TeamsDialogForms({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter()
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [createKey, setCreateKey] = useState(0)
  const [joinKey, setJoinKey] = useState(0)

  const [createState, createAction] = useFormState(createTeam, initialState)
  const [joinState, joinAction] = useFormState(joinTeam, initialState)

  useEffect(() => {
    if (createState.status === 'success') {
      setCreateKey((key) => key + 1)
      onSuccess()
      router.refresh()
    }
  }, [createState.status, onSuccess, router])

  useEffect(() => {
    if (joinState.status === 'success') {
      setJoinKey((key) => key + 1)
      onSuccess()
      router.refresh()
    }
  }, [joinState.status, onSuccess, router])

  return (
    <>
      <DialogHeader>
        <DialogTitle>Criar ou Entrar</DialogTitle>
        <DialogDescription>
          Comece uma nova jornada ou junte-se a uma existente.
        </DialogDescription>
      </DialogHeader>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as 'create' | 'join')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-black/20">
          <TabsTrigger value="create">Criar Nova</TabsTrigger>
          <TabsTrigger value="join">Entrar com Código</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <form action={createAction} key={createKey} className="space-y-4 py-4">
            {createState.status === 'error' && (
              <FormError message={createState.message} />
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Esquadrão</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Devs do Futuro"
                className={cn(
                  'bg-black/20 border-white/10',
                  createState.fieldErrors?.name &&
                    'border-red-500/50 focus-visible:ring-red-500/30',
                )}
                required
                minLength={3}
                maxLength={60}
              />
              <FieldError message={createState.fieldErrors?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Missão (Opcional)</Label>
              <Input
                id="description"
                name="description"
                placeholder="Ex: Dominar o mundo com código"
                className={cn(
                  'bg-black/20 border-white/10',
                  createState.fieldErrors?.description &&
                    'border-red-500/50 focus-visible:ring-red-500/30',
                )}
                maxLength={140}
              />
              <FieldError message={createState.fieldErrors?.description} />
            </div>
            <SubmitButton
              className="w-full bg-brand-violet hover:bg-brand-violet/90"
              icon={<Plus className="h-4 w-4" />}
            >
              Fundar Equipe
            </SubmitButton>
          </form>
        </TabsContent>

        <TabsContent value="join">
          <form action={joinAction} key={joinKey} className="space-y-4 py-4">
            {joinState.status === 'error' && (
              <FormError message={joinState.message} />
            )}
            <div className="space-y-2">
              <Label htmlFor="code">Código de Acesso</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="code"
                  name="code"
                  placeholder="Ex: A1B2C3"
                  className={cn(
                    'pl-9 bg-black/20 border-white/10 font-mono uppercase tracking-widest',
                    joinState.fieldErrors?.code &&
                      'border-red-500/50 focus-visible:ring-red-500/30',
                  )}
                  required
                  minLength={6}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              <FieldError message={joinState.fieldErrors?.code} />
            </div>
            <SubmitButton
              variant="secondary"
              className="w-full"
              icon={<LogIn className="h-4 w-4" />}
            >
              Entrar no Esquadrão
            </SubmitButton>
          </form>
        </TabsContent>
      </Tabs>
    </>
  )
}

export function TeamsDialog({ trigger }: TeamsDialogProps) {
  const [open, setOpen] = useState(false)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!open) {
      setNonce((value) => value + 1)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 sm:max-w-[425px]">
        <TeamsDialogForms key={nonce} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
