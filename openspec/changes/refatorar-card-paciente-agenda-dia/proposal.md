# Proposal

## Why

Os cartões de pacientes da agenda diária ficam ilegíveis quando vários atendimentos coincidem: nomes longos ocupam espaço demais, o conteúdo atual pode criar rolagem interna e a distribuição horizontal não oferece uma quebra previsível quando a largura da coluna se esgota. A grade também não comunica visualmente a linha horária sob o cursor, dificultando relacionar rapidamente um cartão ao horário selecionado.

## What Changes

- Alterar a apresentação visual do paciente para exibir somente o primeiro nome no conteúdo visível do cartão, mantendo a identificação completa disponível em descrição acessível e dica contextual.
- Remover rolagem interna dos cartões em qualquer eixo; conteúdos que não couberem devem ser acomodados por truncamento visual compatível com a altura disponível, sem esconder a identificação acessível.
- Reorganizar cartões simultâneos dentro da coluna do dia em fluxo por linhas: ao esgotar a largura disponível, o próximo cartão deve iniciar na linha inferior, alinhado à esquerda, sem sobreposição nem rolagem horizontal interna do conjunto de cartões.
- Expandir a área temporal necessária quando a quebra em múltiplas linhas exigir espaço adicional, preservando o horário inicial, a duração e a ordem estável dos atendimentos.
- Adicionar destaque de hover à linha horária correspondente, atravessando a régua e as cinco colunas da agenda, sem iniciar ações de domínio ou chamadas HTTP.
- Atualizar testes de modelo e integração para cobrir primeiro nome, ausência de rolagem nos cartões, quebra para a esquerda e destaque da linha horária.

Fora de escopo: contratos HTTP, endpoints, rotas, dados persistidos, regras de autorização, cálculo de fuso, criação de agendamentos e os modos “Dia” e “Lista”.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `weekly-appointments`: ajustar a apresentação e o posicionamento de cartões simultâneos na matriz horária, além de acrescentar o destaque interativo da linha horária.

## Impact

- Afeta a composição visual de `AppointmentsPage` e o modelo de posicionamento da grade semanal, com cobertura nos testes de `weekly-grid` e da página de agendamentos.
- Não altera API, payloads, rotas, permissões, entidades ou dependências externas.
- A mudança é compatível com os dados atuais; a transformação para primeiro nome ocorre apenas na apresentação.
