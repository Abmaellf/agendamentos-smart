import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FormField } from '../form-field'
import { SearchableSelect, type SearchableSelectOption } from '../searchable-select'

const options: SearchableSelectOption[] = [
  { id: 'ana', label: 'Ana Paciente' },
  { id: 'beatriz', label: 'Beatriz Gonçalves' },
  { id: 'carla', label: 'Carla Profissional' },
]

function renderSelect(value = '', onValueChange = () => undefined) {
  return render(
    <FormField label="Paciente" error={value ? undefined : undefined}>
      <SearchableSelect
        options={options}
        value={value}
        onValueChange={onValueChange}
        searchPlaceholder="Buscar paciente"
      />
    </FormField>,
  )
}

describe('SearchableSelect', () => {
  it('filtra por trecho sem diferenciar caixa ou acentuação', async () => {
    const user = userEvent.setup()
    renderSelect()

    await user.click(screen.getByRole('combobox', { name: 'Paciente' }))
    await user.type(screen.getByRole('textbox', { name: 'Buscar paciente' }), 'goncalves')

    expect(screen.getByRole('option', { name: /beatriz gonçalves/i })).toBeVisible()
    expect(screen.queryByRole('option', { name: /ana paciente/i })).not.toBeInTheDocument()
  })

  it('seleciona uma opção e restaura a lista ao limpar a busca', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderSelect('', onValueChange)

    const trigger = screen.getByRole('combobox', { name: 'Paciente' })
    await user.click(trigger)
    const search = screen.getByRole('textbox', { name: 'Buscar paciente' })
    await user.type(search, 'ana')
    await user.clear(search)

    expect(screen.getByRole('option', { name: /beatriz gonçalves/i })).toBeVisible()
    await user.click(screen.getByRole('option', { name: /ana paciente/i }))

    expect(onValueChange).toHaveBeenCalledWith('ana')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('informa quando a busca não encontra opções e fecha sem alterar a seleção', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderSelect('ana', onValueChange)

    const trigger = screen.getByRole('combobox', { name: 'Paciente' })
    await user.click(trigger)
    const search = screen.getByRole('textbox', { name: 'Buscar paciente' })
    await user.type(search, 'inexistente')

    expect(screen.getByText('Nenhuma opção encontrada.')).toBeVisible()
    await user.keyboard('{Escape}')

    expect(onValueChange).not.toHaveBeenCalled()
    expect(trigger).toHaveTextContent('Ana Paciente')
    expect(trigger).toHaveFocus()
  })

  it('permite selecionar com setas e Enter', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderSelect('', onValueChange)

    await user.click(screen.getByRole('combobox', { name: 'Paciente' }))
    await user.keyboard('{ArrowDown}{Enter}')

    expect(onValueChange).toHaveBeenCalledWith('beatriz')
  })

  it('integra o erro do FormField ao combobox', () => {
    render(
      <FormField label="Paciente" error="Selecione um paciente.">
        <SearchableSelect options={options} value="" onValueChange={() => undefined} />
      </FormField>,
    )

    expect(screen.getByRole('combobox', { name: 'Paciente' })).toHaveAttribute(
      'aria-describedby',
      'paciente-error',
    )
  })
})
