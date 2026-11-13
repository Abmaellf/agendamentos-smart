# Tasks

## 1. Contrato, modelo e autorização da API

- [ ] 1.1 No repositório da API, confirmar os modelos reais de serviço, clínica, unidade, sessão, exceções e migrations antes de alterar código; registrar no PR a correspondência com `service_package` e verificar que não há entidade duplicada.
- [ ] 1.2 Criar as estruturas persistentes de definição de pacote e dias da semana, com referências à clínica, unidade e serviço, preço decimal, auditoria, índice de escopo e unicidade por pacote/dia; verificar a migration em banco descartável e os casos de dias repetidos.
- [ ] 1.3 Implementar serviço de domínio transacional que derive clínica e papel da sessão, valide unidade e serviço no escopo, nome, sessões, preço e dias, e derive a frequência; verificar testes de serviço para entradas válidas e inválidas.
- [ ] 1.4 Expor criar, listar, detalhar, atualizar e alterar situação pelos contratos de pacote, sem endpoint `DELETE`; verificar testes de controller/integração para payload, filtros, paginação/ordenação e códigos de erro.
- [ ] 1.5 Restringir todas as operações administrativas a `ADMIN` e impedir acesso entre clínicas/unidades; verificar integração com identidades de duas clínicas, administrador e usuário básico.
- [ ] 1.6 Preparar a verificação de imutabilidade por relação de agendamento de pacote e garantir que, quando a SPEC 02 introduzir esse vínculo, edição e mudança de situação sejam recusadas; verificar teste de integração com pacote referenciado e registrar que a relação depende da SPEC 02.

## 2. Feature de gestão de pacotes no frontend

- [ ] 2.1 Criar `src/features/packages/` com tipos canônicos, adaptador RTK Query, tags de cache e parser do envelope real da API; verificar testes de contrato para coleção, detalhe, decimal, dias e frequência derivada.
- [ ] 2.2 Implementar a rota `/services/packages` com estados de carregamento, erro recuperável, vazio, não autorizado e dados; verificar teste de integração da página com MSW.
- [ ] 2.3 Implementar listagem, detalhe e filtros por unidade, serviço, situação, total de sessões e nome; verificar que os parâmetros e resultados respeitam os filtros e apresentam dias, frequência, preço e situação.
- [ ] 2.4 Implementar formulário administrativo de criação e edição com serviço existente, unidade, nome, descrição, total de sessões, preço, dias de domingo a sábado e frequência somente leitura; verificar testes Zod/UI para um dia, sete dias, duplicidade, sessões inválidas e preço inválido.
- [ ] 2.5 Exibir os retornos de erro de validação, permissão, escopo e imutabilidade sem apagar os dados digitados; verificar testes de mutação para cada código de domínio suportado.
- [ ] 2.6 Implementar ativação/desativação somente para pacote sem agendamento de pacote vinculado, sem ação de exclusão; verificar na interface e em teste integrado que inativos seguem consultáveis no histórico.
- [ ] 2.7 Documentar contratos, estados e lacunas no README da feature `packages`; verificar que a documentação distingue a gestão entregue da SPEC 02 ainda não implementada.

## 3. Navegação e ação temporária de agendamento por pacote

- [ ] 3.1 Transformar Serviços em entrada navegável com submenu Pacotes e rota `/services/packages`, mantendo Relatórios e Financeiro como indisponíveis; verificar testes do menu lateral em modos desktop e compacto, inclusive estado ativo e foco.
- [ ] 3.2 Adicionar ao lado de “Agendar” o botão “Agendamento de Pacotes”, mantendo o fluxo manual inalterado; antes da SPEC 02, fazê-lo comunicar que a função está pendente e não iniciar chamada HTTP, navegação nem mutação; verificar teste do topbar.
- [ ] 3.3 Ajustar a responsividade e os nomes acessíveis dos dois controles de agendamento sem criar rolagem horizontal; verificar os testes de topbar nas larguras cobertas e revisão manual em viewport estreita.
- [ ] 3.4 Atualizar os READMEs de `appointments`, `AppSidebar` e a documentação transversal afetada para refletir o novo menu, a ação temporária e os limites da feature; verificar links e rotas documentadas.

## 4. Verificação integrada

- [ ] 4.1 Executar os testes unitários e de integração adicionados para API e frontend, incluindo isolamento de clínica/unidade, permissões, imutabilidade e ausência de regressão do agendamento manual; registrar comandos e resultados reais.
- [ ] 4.2 Executar `npm run lint`, os testes Vitest afetados e `npm run build`; corrigir falhas introduzidas e registrar separadamente qualquer falha preexistente comprovada.
- [ ] 4.3 Executar `openspec validate gerenciar-pacotes-flexiveis --strict` após atualizar tarefas com evidência real; verificar que proposal, deltas, design e tarefas continuam coerentes.

## Workflow follow-up

- Antes de aplicar, coordenar os contratos e a migration com o repositório da API irmã, que não está neste checkout.
- Não iniciar a SPEC 02 nem remover o botão “Agendar” até que a gestão de pacotes esteja entregue, validada e revisada.
- Arquivar a change somente após todas as tarefas estarem concluídas e a validação estrita estiver aprovada.
