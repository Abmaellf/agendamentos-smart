# Tasks

## 1. Sessão e formulário de agendamento

- [x] 1.1 Ajustar o estado inicial do diálogo para usar `session.activeUnitId` em sessões `BASIC` depois que o catálogo autorizado estiver disponível; verificar com teste de componente que a unidade correta é selecionada e que não há fallback arbitrário. Evidência: teste direcionado de pré-seleção BASIC aprovado.
- [x] 1.2 Desabilitar o `SearchableSelect` de Unidade para `BASIC` e manter a edição para `ADMIN`; verificar atributos acessíveis, seleção ADMIN e payload de criação nos testes do diálogo. Evidência: testes de BASIC bloqueado, ADMIN editável e payload aprovado.
- [x] 1.3 Tratar catálogo vazio, erro e incompatibilidade entre `activeUnitId` e opções recebidas sem permitir envio; verificar mensagens, estado do botão e ausência de unidade inventada. Evidência: testes de catálogo vazio/erro e unidade BASIC ausente aprovados.

## 2. Catálogos e integração com a API

- [x] 2.1 Atualizar mocks/builders do frontend para representar catálogos diferentes para `ADMIN` e `BASIC`, mantendo `USER` da API normalizado como `BASIC`; verificar que pacientes, unidades e profissionais usados pelo diálogo vêm somente da resposta interceptada. Evidência: cenários do diálogo usam catálogo BASIC de uma unidade e catálogo ADMIN com unidade adicional.
- [x] 2.2 Confirmar que digitação no controle pesquisável é filtragem local e não cria requests para ampliar o escopo; verificar contadores de chamadas nos testes de integração. Evidência: teste existente de busca por trecho/acentuação confirma contadores inalterados.
- [x] 2.3 Revisar eventuais telas de pesquisa de usuários, unidades, pacientes e profissionais no frontend e adequar seus controles ao papel da sessão, sem introduzir filtro de autorização exclusivamente no cliente; verificar cada ocorrência encontrada ou registrar explicitamente que não há consumidor. Evidência: auditoria textual encontrou somente o diálogo de agendamento e a busca local do topbar; não há tela de pesquisa de usuários/unidades adicional.

## 3. Documentação e verificação

- [x] 3.1 Atualizar READMEs de `appointments`, `session` e componentes compartilhados para documentar unidade pré-selecionada/bloqueada para BASIC e escopo autoritativo da API; verificar que não há promessa de autorização no navegador. Evidência: READMEs de appointments, features/session e components atualizados.
- [x] 3.2 Executar testes direcionados da sessão e do diálogo, `npm run lint` e `npm run build`; registrar falhas preexistentes separadas de regressões desta change. Evidência: 37 testes direcionados aprovados; lint/build ainda falham somente nos débitos legados de `app-sidebar.test.tsx` e calendário antigo.
- [x] 3.3 Executar `openspec validate restringir-buscas-por-unidade-para-basics --strict` e confirmar que as tarefas permanecem desmarcadas até haver evidência real de implementação. Evidência: validação estrita aprovada no frontend; contrato da API foi validado com `./mvnw -q clean verify` e teste integrado BASIC/ADMIN.

## Workflow follow-up

- Implementar esta change somente após revisão dos contratos junto à change `relacionar-usuarios-unidades-clinicas`.
- Arquivar após a implementação coordenada com a API, testes aprovados e validação estrita.
