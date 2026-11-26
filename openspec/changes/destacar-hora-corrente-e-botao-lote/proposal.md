# Proposal

## Why

Quando há vários pacientes agendados na hora corrente, os cartões individuais não deixam suficientemente claro qual conjunto pertence à ação de atualização em lote. O botão “+” também precisa ficar visualmente associado ao canto inferior direito desse conjunto, conforme a referência fornecida, para tornar evidente o alcance da ação sem alterar o fluxo de domínio existente.

## What Changes

- Envolver os cartões dos pacientes da data e da hora corrente em um único contêiner visual quando houver agendamentos nessa faixa.
- Manter o hover verde existente atravessando toda a linha da hora e aplicar, simultaneamente, uma borda `solid` de `1px` na cor `#6F3CFF` somente na célula de dia + hora sob o mouse; as demais combinações não devem receber essa borda.
- Garantir que o hover seja exclusivamente visual e não inicie atualização ou chamada HTTP apenas por posicionar o cursor.
- Reposicionar um botão circular simples com “+” para o canto inferior direito do contêiner da hora corrente, usando `border-radius: 50%` e preservando foco visível e operação por teclado.
- Manter o botão associado à atualização em lote dos agendamentos elegíveis da hora corrente, sem alterar o contrato HTTP, a seleção por fuso ou as regras de elegibilidade já existentes.
- Atualizar testes da agenda e a documentação da feature para cobrir o agrupamento, o recorte de escopo, o hover e o botão simples.

Fora de escopo: novos endpoints, alteração de payloads, mudanças de status, permissões, cálculo da hora corrente, criação manual, layout de outras visualizações ou alteração dos cartões individuais fora do contêiner da hora corrente.

## Capabilities

### New Capabilities

<!-- Nenhuma capability nova. -->

### Modified Capabilities

- `weekly-appointments`: destacar cada célula de dia + hora somente no hover com `#6F3CFF` e manter o controle circular simples de atualização em lote no canto inferior direito.

## Impact

- Código principal: composição da grade semanal e da ação da hora corrente em `src/features/appointments/pages/appointments-page.tsx`, com possível ajuste de constantes/estilos visuais da grade.
- Verificações: testes de integração da ação da hora corrente e da página de agendamentos, incluindo múltiplos cartões, ausência de borda fora do contexto e acionamento em lote.
- Documentação: `src/features/appointments/README.md`.
- Não há alteração prevista em rotas, endpoints, payloads, dependências, dados persistidos ou permissões.
