# Tasks

## 1. Contrato e autorização de pacientes na API

- [ ] 1.1 Ajustar a autorização de `POST /patient/save` para aceitar `ADMIN` e `USER`, mantendo autenticação obrigatória, e verificar com integração autenticada pelos dois papéis.
- [ ] 1.2 Reforçar no service que a clínica vem do principal, que `unitIds` é não vazio e que `USER` só pode usar sua `clinicUnit`, verificando sucesso, lista vazia, unidade estrangeira, clínica divergente e tentativa de ampliar escopo.
- [ ] 1.3 Criar `PrincipalServiceResponse` em `dtos/patient` quando o serviço principal fizer parte do contrato, completar o DTO/mapper de listagem com os campos reais necessários à tela — código, nome, data, status e serviço principal quando houver fonte de domínio — e verificar o JSON com teste de contrato sem valores artificiais.
- [ ] 1.4 Implementar os parâmetros de paginação e filtros que a tela exporá, preservando o escopo por clínica/unidade, e verificar primeira página, página seguinte, nome, status, serviço e limpeza dos critérios.
- [ ] 1.5 Atualizar `controller/patient/README.md`, `service/README.md` e os testes da API para remover a contradição entre a regra documentada e a anotação de autorização, verificando que o contrato publicado descreve `ADMIN`/`BASIC` e o vínculo de unidade.

## 2. Cadastro único alinhado ao contexto da sessão no frontend

- [ ] 2.1 Atualizar os tipos e o adaptador de criação para enviar `name` e `unitIds` a `POST /patient/save`, tipar a resposta do paciente e verificar o payload com teste de integração.
- [ ] 2.2 Fazer o formulário carregar a sessão e o catálogo autorizado de unidades, usar `activeUnitId` fixo para `BASIC` e permitir seleção somente de unidades da própria clínica para `ADMIN`, verificando os dois papéis e o caso de unidade ativa ausente.
- [ ] 2.3 Mapear `VALIDATION_ERROR`, `CLINIC_ACCESS_DENIED`, `TENANT_RESOURCE_NOT_FOUND`, `PATIENT_ALREADY_EXISTS` e 403 para mensagens acionáveis, preservando os dados digitados quando o cadastro falhar e verificando cada cenário com MSW/RTL.
- [ ] 2.4 Remover o caminho executável do `PatientContext` que chama `POST patients`, eliminar o payload legado e invalidar/refazer a consulta autorizada após sucesso, verificando que a tela não dispara o endpoint plural.

## 3. Listagem modernizada e estados da interface

- [ ] 3.1 Refatorar a página e as linhas para usar os dados da API, remover código/data/status/paginação fixos e renderizar avatar por iniciais, serviço principal opcional, status textual e ações sem callback como indisponíveis; verificar conteúdo e acessibilidade com testes de página.
- [ ] 3.2 Implementar barra de busca, filtros de status/serviço e “Limpar filtros” conforme o contrato da API, incluindo estado vazio e retorno à primeira página; verificar contagem de requests, parâmetros e linhas exibidas.
- [ ] 3.3 Aplicar a identidade visual da referência — verde de marca, cabeçalho contrastante, card arredondado, zebra/hover/foco e chips de status — com estados de carregamento e erro recuperáveis; verificar visualmente em viewport amplo e compacto e com teste de acessibilidade.
- [ ] 3.4 Ligar a paginação aos metadados reais da resposta, incluindo total, página corrente, limites e controles de primeiro/anterior/próximo/último; verificar que cada ação consulta a página correta e não perde os filtros ativos.

## 4. Verificação integrada e documentação

- [ ] 4.1 Atualizar `src/features/patients/README.md` e os tipos/documentação de contrato para registrar o endpoint único, `unitIds`, o comportamento `ADMIN`/`BASIC` e os campos opcionais da listagem; verificar que nenhum README ainda apresenta `POST patients` como fluxo ativo.
- [ ] 4.2 Executar os testes direcionados da API e do frontend, `npm run lint` e `npm run build`, registrando falhas preexistentes ou bloqueios de ambiente com a saída real dos comandos.
- [ ] 4.3 Executar `openspec validate modernizar-listagem-e-vincular-pacientes --strict` e revisar que todos os requisitos têm cenários, as tarefas refletem a implementação real e a change está pronta para o apply.

## Workflow follow-up

- Aplicar a change somente após revisão do contrato de status/serviço principal e da dependência `relacionar-usuarios-unidades-clinicas`.
- Arquivar somente depois de concluir as tarefas, validar a change e promover o delta para `openspec/specs/legacy-patient-management/spec.md`.
