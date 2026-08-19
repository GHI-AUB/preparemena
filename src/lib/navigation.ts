import type { View } from '../components/Shell'
import type { Filters } from '../types'

const validViews = new Set<View>(['overview', 'country', 'context', 'about', 'methodology'])

export function parseView(value: string | null): View {
  if (value === 'compare') return 'context'
  if (value === 'situation') return 'overview'
  return value && validViews.has(value as View) ? value as View : 'overview'
}

export type FoundationKey = 'physicians' | 'nurses' | 'beds' | 'imm_measles' | 'imm_dpt' | 'water' | 'sanitation' | 'life_exp' | 'u5mort'
export type PeerMode = 'income' | 'conflict' | 'all'
export const foundationKeys = new Set<FoundationKey>(['physicians','nurses','beds','imm_measles','imm_dpt','water','sanitation','life_exp','u5mort'])
export function parseFoundation(value: string | null): FoundationKey { return foundationKeys.has(value as FoundationKey) ? value as FoundationKey : 'physicians' }
export function parsePeerMode(value: string | null): PeerMode { return value === 'conflict' || value === 'all' ? value : 'income' }

export function parseFilters(params: URLSearchParams): Filters {
  return {
    income: params.get('income') || 'all',
    conflict: ['conflict', 'stable'].includes(params.get('conflict') || '') ? params.get('conflict')! : 'all',
  }
}
