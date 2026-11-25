import { UsersRound } from 'lucide-react'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { render } from '@testing-library/react'

import { PageContainer, PageHeader } from '../page-shell'

describe('page shells', () => {
  it('renderiza resumo, ícone, descrição e ação com semântica de página', () => {
    render(
      <PageContainer>
        <PageHeader
          title="Pacientes"
          description="Gerencie seus pacientes."
          icon={<UsersRound aria-hidden="true" />}
          actions={<button type="button">Novo paciente</button>}
        />
      </PageContainer>,
    )

    expect(screen.getByRole('main')).toHaveClass('overflow-x-hidden')
    expect(screen.getByRole('heading', { name: 'Pacientes' })).toBeVisible()
    expect(screen.getByText('Gerencie seus pacientes.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Novo paciente' })).toBeVisible()
    expect(screen.getByRole('heading')).toHaveClass('text-3xl')
  })

  it('permite um cabeçalho sem ícone ou ação', () => {
    render(
      <PageContainer>
        <PageHeader title="Pacotes" />
      </PageContainer>,
    )

    expect(screen.getByRole('heading', { name: 'Pacotes' })).toBeVisible()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
