'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

type TeamField = 'name' | 'description' | 'code'

export type TeamActionState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Partial<Record<TeamField, string>>
}

const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'O nome precisa ter pelo menos 3 caracteres.')
    .max(60, 'O nome pode ter no máximo 60 caracteres.')
    .transform((value) => value.replace(/\s+/g, ' ')),
  description: z
    .string()
    .trim()
    .max(140, 'A descrição pode ter no máximo 140 caracteres.')
    .transform((value) => value.replace(/\s+/g, ' ')),
})

const joinTeamSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, 'O código precisa ter 6 caracteres.')
    .regex(/^[A-Za-z0-9]+$/, 'Use apenas letras e números.')
    .transform((value) => value.toUpperCase()),
})

function getText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function toFieldErrors(error: z.ZodError) {
  const fieldErrors: Partial<Record<TeamField, string>> = {}

  for (const issue of error.issues) {
    const field = issue.path[0]
    if (field === 'name' || field === 'description' || field === 'code') {
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
  }

  return fieldErrors
}

const genericErrorMessage =
  'Não foi possível concluir a operação agora. Tente novamente.'

export async function createTeam(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      status: 'error',
      message: 'Você precisa estar autenticado para criar um esquadrão.',
    }
  }

  const parsed = createTeamSchema.safeParse({
    name: getText(formData, 'name'),
    description: getText(formData, 'description'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Revise os campos destacados.',
      fieldErrors: toFieldErrors(parsed.error),
    }
  }

  const { name, description } = parsed.data
  const normalizedDescription = description.length > 0 ? description : null

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      name,
      description: normalizedDescription,
      owner_id: user.id,
    })
    .select('id')
    .single()

  if (teamError || !team) {
    console.error('Erro ao criar esquadrão:', teamError)
    return { status: 'error', message: genericErrorMessage }
  }

  const { error: memberError } = await supabase.from('team_members').insert({
    team_id: team.id,
    user_id: user.id,
    role: 'owner',
  })

  if (memberError) {
    console.error('Erro ao vincular líder:', memberError)
    await supabase.from('teams').delete().eq('id', team.id)
    return { status: 'error', message: genericErrorMessage }
  }

  revalidatePath('/dashboard/teams')
  return { status: 'success' }
}

export async function joinTeam(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      status: 'error',
      message: 'Você precisa estar autenticado para entrar em um esquadrão.',
    }
  }

  const parsed = joinTeamSchema.safeParse({
    code: getText(formData, 'code'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Revise o código informado.',
      fieldErrors: toFieldErrors(parsed.error),
    }
  }

  const { code } = parsed.data

  const { data: teamResult, error: teamError } = await supabase.rpc(
    'get_team_by_code',
    { code_input: code },
  )

  if (teamError) {
    console.error('Erro ao buscar esquadrão:', teamError)
    return { status: 'error', message: 'Código inválido ou esquadrão não encontrado.' }
  }

  const team = Array.isArray(teamResult) ? teamResult[0] : teamResult

  if (!team?.id) {
    return { status: 'error', message: 'Código inválido ou esquadrão não encontrado.' }
  }

  const { data: existingMember, error: existingMemberError } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMemberError) {
    console.error('Erro ao validar membro existente:', existingMemberError)
    return { status: 'error', message: genericErrorMessage }
  }

  if (existingMember) {
    return { status: 'error', message: 'Você já faz parte deste esquadrão.' }
  }

  const { error: joinError } = await supabase.from('team_members').insert({
    team_id: team.id,
    user_id: user.id,
    role: 'member',
  })

  if (joinError) {
    console.error('Erro ao entrar no esquadrão:', joinError)
    return { status: 'error', message: genericErrorMessage }
  }

  revalidatePath('/dashboard/teams')
  return { status: 'success' }
}
