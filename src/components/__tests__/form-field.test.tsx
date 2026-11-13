import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FormField } from '../form-field'

describe('FormField', () => {
  it('associa o rótulo, o controle e a mensagem de erro', () => {
    render(
      <FormField label="Nome" error="Nome é obrigatório">
        <input />
      </FormField>,
    )

    const input = screen.getByRole('textbox', { name: 'Nome' })

    expect(input).toHaveAttribute('id', 'nome')
    expect(input).toHaveAttribute('aria-describedby', 'nome-error')
    expect(screen.getByText('Nome é obrigatório')).toHaveAttribute(
      'id',
      'nome-error',
    )
  })

  it('preserva um id fornecido e uma descrição existente sem erro', () => {
    render(
      <FormField label="Paciente">
        <input id="patient-name" aria-describedby="patient-help" />
      </FormField>,
    )

    const input = screen.getByRole('textbox', { name: 'Paciente' })

    expect(input).toHaveAttribute('id', 'patient-name')
    expect(input).toHaveAttribute('aria-describedby', 'patient-help')
  })
})
