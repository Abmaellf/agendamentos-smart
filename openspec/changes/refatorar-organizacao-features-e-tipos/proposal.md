# Proposal

## Why

O domínio de pacientes está espalhado entre `src/page/patient`, `src/context`,
`src/api`, `src/components` e contratos em `src/@types`, enquanto
`appointments` já segue uma organização por feature. Essa divergência aumenta
o acoplamento, dificulta localizar responsabilidades e torna caro criar os
próximos domínios previstos para profissionais, serviços, relatórios, financeiro
e usuários.

Esta change estabelece um padrão de módulos por domínio, migra a superfície
existente de pacientes para `src/features/patients` e define como os contratos
compartilhados devem ser organizados em `src/@types`, preservando o comportamento
atual durante a refatoração.

## What Changes

- Criar uma convenção de feature por domínio, baseada no módulo existente de
  `appointments`, com limites explícitos para `api`, `components`, `model`,
  `pages`, `__tests__` e documentação do módulo quando aplicável.
- Migrar tudo que pertence ao fluxo de pacientes para `src/features/patients`,
  incluindo a página, componentes específicos, contexto/estado legado, APIs e
  testes relacionados; remover os caminhos antigos somente depois de atualizar
  todos os consumidores.
- Manter a rota `/paciente`, o comportamento observável e os contratos HTTP
  atuais durante a movimentação, registrando incompatibilidades existentes como
  débito e não como comportamento novo.
- Catalogar os tipos compartilhados por domínio em `src/@types`, redirecionando
  imports de pacientes e dos demais módulos para contratos canônicos e
  eliminando duplicações onde houver equivalência comprovada.
- Diferenciar contratos compartilhados de tipos privados de implementação:
  tipos usados por mais de um módulo ou que representam API/domínio ficam em
  `src/@types`; tipos triviais usados uma única vez podem permanecer próximos ao
  consumidor.
- Documentar o padrão para futuras features `professionals`, `services`,
  `reports`, `financial`, `users` e novos domínios, sem criar telas ou fluxos
  funcionais desses domínios nesta change.
- **Fora de escopo:** unificar os dois fluxos legados de criação de pacientes,
  corrigir endpoints ou payloads da API, implementar editar/desativar,
  alterar regras de autorização/tenant, mudar rotas públicas ou introduzir
  novas dependências.

## Capabilities

### New Capabilities

- `feature-module-architecture`: padrão estrutural verificável para organizar
  domínios em `src/features`, migrar pacientes e centralizar contratos
  compartilhados em `src/@types`.

### Modified Capabilities

- Nenhuma. A mudança preserva os requisitos funcionais existentes de
  `legacy-patient-management`; a localização do código e os imports serão
  alterados sem ampliar o comportamento da tela.

## Impact

- Código: `src/page/patient`, `src/context/PatientContext.tsx`,
  `src/api/register-patient.ts`, `src/components/AddPatientModal.tsx`,
  componentes específicos de pacientes, `Router.tsx`, `App.tsx`, testes e
  READMEs afetados.
- Tipos: `src/@types/patient.ts`, `appointment.ts`, `components.ts`,
  `UserTypes.ts` e interfaces locais em módulos de API/formulário serão
  auditados e redirecionados conforme o novo limite de compartilhamento.
- Rotas e HTTP: nenhuma alteração intencional; `/paciente` e os endpoints
  observados permanecem compatíveis nesta etapa.
- Dependências: nenhuma dependência nova prevista. A verificação deve incluir
  lint, build, testes afetados e uma checagem estrutural de imports/arquivos.
- Documentação: README da feature de pacientes, `src/README.md`,
  `src/@types/README.md` e documentos transversais necessários devem refletir o
  padrão e distinguir estado entregue de intenção futura.
