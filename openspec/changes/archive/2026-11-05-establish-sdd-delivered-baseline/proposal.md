# Proposal

## Why

O projeto possui documentação e uma spec legada para criação manual de agendamentos, mas não tinha um fluxo único que ligasse requisitos, exploração estrutural, implementação e validação. Isso torna difícil separar o comportamento efetivamente entregue de MVPs e correções ainda pendentes.

## What Changes

- Inicializar OpenSpec no repositório e estabelecer regras SDD orientadas ao frontend e sua API externa.
- Configurar o uso de CodeGraph como ferramenta preferencial para relações de código e impacto.
- Registrar, em specs duráveis, as capacidades observadas no checkout sem declarar como concluídos os fluxos incompletos.
- Documentar a instalação, o fluxo diário e as divergências da linha de base.

## Capabilities

### New Capabilities

- `sdd-governance`: governança obrigatória de change, spec, tarefas, validação e uso do grafo.
- `application-shell-baseline`: composição entregue da SPA, rotas e layouts disponíveis.
- `access-session-baseline`: entrada, redirecionamento inicial e leitura de sessão usada pela agenda.
- `weekly-appointments`: consulta semanal e criação manual de agendamentos.
- `legacy-patient-management`: listagem e fluxos legados de paciente presentes no checkout.

### Modified Capabilities

Nenhuma.

## Impact

São adicionados arquivos de governança, documentação e especificação. Não há alteração deliberada de runtime, contrato HTTP, dados, dependências da aplicação ou código de produção.
