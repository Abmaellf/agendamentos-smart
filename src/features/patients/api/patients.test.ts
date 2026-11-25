import { describe, expect, it } from 'vitest'

import { patientListItems } from '@/test/builders/patient'

import { normalizePatientPage } from './patients'

describe('normalizePatientPage', () => {
  it('preserva conteúdo e metadados da resposta paginada', () => {
    const result = normalizePatientPage({
      content: patientListItems.slice(0, 1),
      page: 2,
      size: 5,
      totalElements: 11,
      totalPages: 3,
      last: false,
    })

    expect(result).toEqual({
      content: patientListItems.slice(0, 1),
      page: 2,
      size: 5,
      totalElements: 11,
      totalPages: 3,
      last: false,
    })
  })

  it('trata coleção legada como uma única página sem inventar páginas', () => {
    const result = normalizePatientPage(patientListItems, { page: 3, size: 10 })

    expect(result.content).toEqual(patientListItems)
    expect(result.page).toBe(0)
    expect(result.size).toBe(10)
    expect(result.totalElements).toBe(patientListItems.length)
    expect(result.totalPages).toBe(1)
    expect(result.last).toBe(true)
  })

  it('normaliza coleção vazia como página concluída', () => {
    expect(normalizePatientPage([])).toEqual({
      content: [],
      page: 0,
      size: 5,
      totalElements: 0,
      totalPages: 0,
      last: true,
    })
  })
})
