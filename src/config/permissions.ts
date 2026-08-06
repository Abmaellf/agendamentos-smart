export const permissions = {
  patient: {
    list: 'patient:list',
  },
} as const

export type Permission =
  (typeof permissions)[keyof typeof permissions][keyof (typeof permissions)[keyof typeof permissions]]
