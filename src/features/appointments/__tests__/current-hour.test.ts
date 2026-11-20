import { describe, expect, it } from 'vitest'

import { getCurrentHourContext } from '../model/current-hour'

describe('contexto da hora corrente', () => {
  it('calcula a faixa no fuso da unidade, sem usar o fuso do navegador', () => {
    const context = getCurrentHourContext(
      new Date('2026-08-13T16:30:00.000Z'),
      'America/Cuiaba',
    )

    expect(context).toEqual({
      dateKey: '2026-08-13',
      hour: 12,
      hourStart: '2026-08-13T16:00:00.000Z',
      hourEnd: '2026-08-13T17:00:00.000Z',
    })
  })

  it('avança a data local corretamente na virada de meia-noite', () => {
    const context = getCurrentHourContext(
      new Date('2026-08-14T03:30:00.000Z'),
      'America/Cuiaba',
    )

    expect(context.dateKey).toBe('2026-08-13')
    expect(context.hour).toBe(23)
    expect(context.hourStart).toBe('2026-08-14T03:00:00.000Z')
  })

  it('troca de faixa exatamente na fronteira da hora', () => {
    expect(
      getCurrentHourContext(
        new Date('2026-08-13T11:59:59.999Z'),
        'America/Cuiaba',
      ).hour,
    ).toBe(7)
    expect(
      getCurrentHourContext(
        new Date('2026-08-13T12:00:00.000Z'),
        'America/Cuiaba',
      ).hour,
    ).toBe(8)
  })

  it('rejeita fuso inválido para que a página possa ocultar a ação', () => {
    expect(() =>
      getCurrentHourContext(new Date('2026-08-13T12:00:00.000Z'), 'Fuso/Inexistente'),
    ).toThrow()
  })
})
