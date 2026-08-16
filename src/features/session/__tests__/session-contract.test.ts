import { describe, expect, it } from 'vitest'

import { loadSubject } from '@/test/load-subject'

interface SessionModule {
  parseSessionProfile(value: unknown): {
    user: { id: string; login: string; role: 'ADMIN' | 'BASIC' }
    tenantId: string
    activeUnitId: string
  }
}

const subjectUrl = new URL('../model/session.ts', import.meta.url)

describe('contrato da sessão usado pelo agendamento', () => {
  it('WB-23 expõe papel, tenant e unidade e descarta senha', async () => {
    const { parseSessionProfile } = await loadSubject<SessionModule>(subjectUrl)

    const session = parseSessionProfile({
      id: 'user-admin',
      login: 'admin@clinica.test',
      role: 'ADMIN',
      password: 'não-deve-chegar-ao-front',
      tenantId: 'tenant-a',
      activeUnitId: 'unit-a',
    })

    expect(session).toEqual({
      user: {
        id: 'user-admin',
        login: 'admin@clinica.test',
        role: 'ADMIN',
      },
      tenantId: 'tenant-a',
      activeUnitId: 'unit-a',
    })
    expect(session).not.toHaveProperty('password')
    expect(session.user).not.toHaveProperty('password')
  })

  it.each(['USER', 'MASTER', 'admin', ''])(
    'WB-23 rejeita papel não canônico %s',
    async (role) => {
      const { parseSessionProfile } =
        await loadSubject<SessionModule>(subjectUrl)

      expect(() =>
        parseSessionProfile({
          id: 'user-x',
          login: 'x@clinica.test',
          role,
          tenantId: 'tenant-a',
          activeUnitId: 'unit-a',
        }),
      ).toThrow()
    },
  )
})
