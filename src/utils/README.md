# Utilitários de domínio genérico

## Objetivo do módulo

Disponibilizar formatadores reutilizáveis independentes de React.

## Responsabilidades e funcionalidades existentes

`formatter.ts` exporta formatadores `pt-BR` de data e moeda BRL.

## Dependências internas e externas

Depende somente da API `Intl` do navegador. Não possui consumidor ativo. Módulos relacionados: `lib/utils.ts`, que é dedicado a classes CSS, e as páginas que hoje formatam datas diretamente com date-fns.

## Pontos de entrada e fluxos de entrada

Nenhum fluxo ativo importa `dateFormatter` ou `priceFormatter`.

## Arquivo crítico

- `formatter.ts`: órfão no estado atual.

## Regras próprias do módulo

- Datas e horários de agendamento devem ser formatados em `pt-BR`, preservando o fuso explícito recebido pelo contrato.
- Duração deve ter um formatador único e preço deve usar BRL, sem alterar os valores históricos do agendamento.
- CPF, CNPJ e telefone podem ter máscaras puras nesta pasta; validade e unicidade pertencem ao schema/domínio/API.
- Formatadores não podem decidir disponibilidade, conflito, estado ou permissão.

## Observações técnicas e débitos

- Datas da agenda são formatadas diretamente com date-fns, duplicando a finalidade potencial deste módulo.
- Definir uma estratégia única antes de adicionar novos formatadores.
