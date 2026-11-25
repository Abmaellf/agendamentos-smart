import { describe, expect, it } from 'vitest'

import {
  normalizeServicePackagePage,
  type ServicePackage,
} from './packages'

const servicePackage: ServicePackage = {
  id: 'package-1',
  unitId: 'unit-1',
  unitName: 'Matriz',
  serviceId: 'service-1',
  serviceName: 'Fisioterapia',
  name: 'Fisioterapia 10 sessões',
  description: 'Recuperação funcional',
  totalSessions: 10,
  totalPrice: '400.00',
  weekDays: ['MONDAY', 'WEDNESDAY'],
  weeklyFrequency: 2,
  active: true,
}

describe('normalizeServicePackagePage', () => {
  it('preserva conteúdo e metadados da resposta paginada', () => {
    expect(
      normalizeServicePackagePage({
        content: [servicePackage],
        page: 2,
        size: 10,
        totalElements: 21,
        totalPages: 3,
        last: false,
      }),
    ).toEqual({
      content: [servicePackage],
      page: 2,
      size: 10,
      totalElements: 21,
      totalPages: 3,
      last: false,
    })
  })

  it('normaliza o envelope legado como uma única página', () => {
    expect(
      normalizeServicePackagePage(
        { content: [servicePackage] },
        { page: 1, size: 5 },
      ),
    ).toEqual({
      content: [servicePackage],
      page: 0,
      size: 5,
      totalElements: 1,
      totalPages: 1,
      last: true,
    })
  })

  it('aceita a resposta em array e mantém a página legada finita', () => {
    expect(normalizeServicePackagePage([], { page: 0, size: 10 })).toEqual({
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      last: true,
    })
  })
})
