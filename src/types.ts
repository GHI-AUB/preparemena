export type ContextObservation = { value: number; year: number }
export type IndicatorDefinition = { key: string; label: string; definition: string; unit: string; source_code: string; source: string; direction: string; scale: 'percentage' | 'nonnegative' | 'score'; context_selector?: boolean }

export type Country = {
  iso3: string
  name: string
  conflict: boolean
  income: string | null
  region?: string
  ihr_composite: number | null
  ihr_year: number | null
  ihr_trend: Array<{ year: number; value: number }>
  capacities: Record<string, number | null>
  capacity_years?: Record<string, number | null>
  context: Record<string, ContextObservation>
  refugees?: Record<string, number>
  rank?: number
}

export type Dataset = {
  meta: {
    generated: string
    last_successful_refresh?: string
    schema_version?: string
    displacement_year?: number
    sources: string[]
    source_refresh?: Record<string, {
      endpoint: string
      status: 'success' | 'static'
      retrieved_at: string
      coverage: number
      reference_year: number | string | null
    }>
    capacity_order: string[]
    fcs_note: string
    region_median?: number
    region_mean?: number
    capacity_median?: Record<string, number>
    context_median?: Record<string, number>
    indicator_definitions?: IndicatorDefinition[]
  }
  countries: Country[]
}

export type Filters = {
  income: string
  conflict: string
  capacity: string
}
