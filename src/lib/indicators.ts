import type { IndicatorDefinition } from '../types'

export const contextIndicators: IndicatorDefinition[] = [
  { key: 'physicians', label: 'Physicians', definition: 'Physicians available per 1,000 people.', unit: 'per 1,000 people', source_code: 'SH.MED.PHYS.ZS', source: 'World Bank', direction: 'Higher values indicate greater physician availability; this is not a measure of quality or distribution.', scale: 'nonnegative', context_selector: true },
  { key: 'nurses', label: 'Nurses and midwives', definition: 'Nursing and midwifery personnel per 1,000 people.', unit: 'per 1,000 people', source_code: 'SH.MED.NUMW.P3', source: 'World Bank', direction: 'Higher values indicate greater reported workforce availability.', scale: 'nonnegative', context_selector: true },
  { key: 'beds', label: 'Hospital beds', definition: 'Hospital beds available per 1,000 people.', unit: 'per 1,000 people', source_code: 'SH.MED.BEDS.ZS', source: 'World Bank', direction: 'Higher values indicate greater reported bed availability, not readiness or quality.', scale: 'nonnegative', context_selector: true },
  { key: 'imm_measles', label: 'Measles immunization', definition: 'Children receiving measles-containing vaccine.', unit: '% of eligible children', source_code: 'SH.IMM.MEAS', source: 'World Bank', direction: 'Higher coverage is generally favourable.', scale: 'percentage', context_selector: true },
  { key: 'imm_dpt', label: 'DPT immunization', definition: 'Children receiving the third DPT dose.', unit: '% of eligible children', source_code: 'SH.IMM.IDPT', source: 'World Bank', direction: 'Higher coverage is generally favourable.', scale: 'percentage', context_selector: true },
  { key: 'water', label: 'Safely managed drinking water', definition: 'Population using safely managed drinking-water services.', unit: '% of population', source_code: 'SH.H2O.SMDW.ZS', source: 'World Bank', direction: 'Higher service coverage is generally favourable.', scale: 'percentage', context_selector: true },
  { key: 'sanitation', label: 'Safely managed sanitation', definition: 'Population using safely managed sanitation services.', unit: '% of population', source_code: 'SH.STA.SMSS.ZS', source: 'World Bank', direction: 'Higher service coverage is generally favourable.', scale: 'percentage', context_selector: true },
  { key: 'life_exp', label: 'Life expectancy at birth', definition: 'Expected years of life at birth under current mortality patterns.', unit: 'years', source_code: 'SP.DYN.LE00.IN', source: 'World Bank', direction: 'Higher values are generally favourable but are not a preparedness measure.', scale: 'nonnegative', context_selector: true },
  { key: 'u5mort', label: 'Under-five mortality', definition: 'Probability of dying before age five.', unit: 'deaths per 1,000 live births', source_code: 'SH.DYN.MORT', source: 'World Bank', direction: 'Lower values are generally favourable; interpret the association in the opposite direction to service-coverage indicators.', scale: 'nonnegative', context_selector: true },
  { key: 'health_exp_pc', label: 'Current health expenditure per capita', definition: 'Current health expenditure per person.', unit: 'current US$ per person', source_code: 'SH.XPD.CHEX.PC.CD', source: 'World Bank', direction: 'Higher spending is not inherently more efficient or effective.', scale: 'nonnegative' },
  { key: 'health_exp_gdp', label: 'Current health expenditure', definition: 'Current health expenditure as a share of GDP.', unit: '% of GDP', source_code: 'SH.XPD.CHEX.GD.ZS', source: 'World Bank', direction: 'Higher values are not inherently favourable.', scale: 'percentage' },
  { key: 'oop', label: 'Out-of-pocket expenditure', definition: 'Out-of-pocket spending as a share of current health expenditure.', unit: '% of current health expenditure', source_code: 'SH.XPD.OOPC.CH.ZS', source: 'World Bank', direction: 'Lower values may indicate stronger financial protection; context matters.', scale: 'percentage' },
]

export const foundationIndicators = contextIndicators.filter(indicator => indicator.context_selector)

export function indicatorDefinition(key: string, supplied?: IndicatorDefinition[]) {
  return supplied?.find(item => item.key === key) ?? contextIndicators.find(item => item.key === key)
}
