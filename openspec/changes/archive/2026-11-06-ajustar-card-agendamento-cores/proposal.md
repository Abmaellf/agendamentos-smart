# Proposal

## Why

O cartão atualmente exibido na agenda semanal usa uma paleta diferente da referência visual fornecida e não comunica com clareza a hierarquia visual do atendimento. Esta change registra o contrato visual necessário para que o cartão completo — horário, paciente, serviço e estado — seja ajustado de forma consistente com a imagem antes da implementação.

## What Changes

- Atualizar a apresentação visual do cartão da agenda semanal para seguir a referência: cartão compacto, bordas claras, cantos levemente arredondados, sombra discreta e contraste suficiente entre fundo e conteúdo.
- Preservar no cartão o horário local, o nome do paciente e o nome do serviço; o estado continua disponível para tecnologia assistiva e para o atributo identificador do cartão.
- Definir quatro famílias visuais derivadas dos estados canônicos: amarelo, verde, grafite e vermelho, com texto preto no amarelo e texto branco nas demais cores.
- Aplicar uma tabela determinística de cores aos seis estados atuais, sem alterar o valor retornado pela API nem transformar cor em regra de negócio.
- Cobrir o contrato visual com testes da agenda semanal e verificar a renderização responsiva do conteúdo do cartão.

Fora de escopo: alterar endpoints, payloads, estados persistidos, ordenação da agenda, regras de conflito, permissões, criação de agendamentos ou os modos “Dia” e “Lista”. A mudança também não reativa os componentes legados sem consumidores.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `weekly-appointments`: altera o requisito de apresentação dos cartões para definir o cartão completo e sua paleta visual conforme a referência fornecida.

## Impact

- Código afetado: `src/features/appointments/pages/appointments-page.tsx` e os testes de integração da agenda semanal; os tokens compartilhados em `src/globals.css` podem ser ajustados se necessário.
- Contratos HTTP, rota `/appointments`, dados, cache, permissões e dependências permanecem inalterados.
- A referência visual não fornece uma legenda explícita de estado. Para tornar o contrato implementável, a change usará como hipótese de planejamento: `AGENDADO`/`REAGENDADO` em amarelo, `EMATENDIMENTO`/`FINALIZADO` em verde, `CANCELADO` em grafite e `FALTA` em vermelho; essa correspondência deve ser confirmada visualmente durante a implementação.
