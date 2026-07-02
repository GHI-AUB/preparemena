export const copy = {
  product: 'PREPARE MENA',
  navigation: {
    overview: 'Regional overview',
    context: 'Context & pressures',
    country: 'Country profile',
    about: 'About',
    methodology: 'Methodology & data quality',
  },
} as const

export type CopyTree = typeof copy
