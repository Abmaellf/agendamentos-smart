# Design

## Context

Consulte `proposal.md` para a motivação e
`specs/feature-module-architecture/spec.md` para o contrato. Hoje
`appointments` já oferece a referência de uma feature por domínio, mas
pacientes ainda combina página, contexto, API e componentes específicos em
camadas técnicas distintas. A análise do CodeGraph também mostrou que
`PatientContext`, a rota, os dois diálogos de cadastro e os contratos em
`src/@types` possuem consumidores diferentes.

A refatoração não pode assumir que o frontend define autorização, tenant ou
contratos reais do backend. Ela deve preservar os endpoints e as formas
existentes e registrar divergências observadas para changes funcionais futuras.

## Goals / Non-Goals

**Goals:**

- estabelecer `src/features/<domain>` como fronteira canônica de código de
  domínio;
- tornar `patients` autocontida sem alterar a rota ou o comportamento observado;
- centralizar contratos de domínio e transporte compartilhados em `src/@types`;
- auditar os tipos atuais e deixar explícito por que tipos privados não foram
  movidos;
- fornecer um padrão aplicável aos próximos domínios sem criar produto
  inacabado.

**Non-Goals:**

- corrigir ou unificar os dois fluxos legados de criação de pacientes;
- implementar editar, desativar, detalhes, paginação real ou novos estados da
  tela;
- alterar endpoints, payloads, autorização, isolamento de tenant ou modelo de
  dados do backend;
- criar features funcionais de profissionais, serviços, relatórios, financeiro
  ou usuários;
- introduzir uma biblioteca de gerenciamento de estado ou dependência nova.

## Decisions

### Usar o padrão de `appointments` como referência mínima

Cada domínio terá `api/`, `components/`, `model/`, `pages/` e `__tests__/`
somente quando houver conteúdo daquela responsabilidade. A feature terá um
README curto com objetivo, estrutura, fluxo, contratos externos e lacunas
conhecidas.

Pastas globais por camada continuariam reproduzindo o problema atual; criar
uma estrutura totalmente diferente de `appointments` aumentaria a migração
futura. A convenção não exige arquivos vazios nem placeholders de produto.

### Migrar pacientes por classificação de responsabilidade

O destino será definido pelo comportamento, não apenas pelo nome do arquivo:

- a composição da rota vai para `features/patients/pages`;
- tabela, filtro, diálogos e o modal de cadastro específico vão para
  `features/patients/components`;
- `PatientContext` será mantido dentro da feature como estado legado durante a
  refatoração, em `model` ou módulo equivalente, para não continuar sendo um
  contexto global sem dono;
- os adaptadores de paciente vão para `features/patients/api`;
- testes que exercitam apenas pacientes acompanham a feature;
- `components/ui`, layouts, store e clientes HTTP continuam compartilhados;
- `CardPatient` permanece associado a `appointments` se sua responsabilidade
  continuar sendo apresentar um agendamento, mesmo que o nome contenha
  “Patient”.

A alternativa de manter os arquivos antigos como reexports permanentes foi
  rejeitada: prolongaria duas fontes de verdade. Se for necessário um período
  transitório, qualquer reexport deve ser temporário, documentado e removido na
  mesma change.

### Organizar `src/@types` por contrato, não por consumidor visual

Tipos compartilhados serão agrupados por domínio ou contrato transversal:

- `patient.ts` será a fonte de `Patient` e dos comandos/consultas de paciente,
  incluindo props de componentes de paciente quando forem compartilhadas;
- `appointment.ts` continuará sendo a fonte dos contratos de agenda e de suas
  projeções de catálogo usadas pela agenda;
- contratos de sessão, usuário, autenticação e perfil serão separados ou
  renomeados de forma consistente quando a auditoria comprovar que são
  fronteiras distintas;
- tipos puramente de um componente, tipos derivados de schema e tipos de
  infraestrutura local permanecerão junto do consumidor.

Essa regra evita tanto interfaces duplicadas em `api`/componentes quanto um
arquivo `components.ts` usado como depósito de todos os domínios. A equivalência
entre tipos será confirmada pelos usos e pelos testes existentes; quando o
contrato externo não for conhecido, a forma atual será preservada e a lacuna
será documentada.

### Manter uma direção de dependências

O fluxo permitido será `Router/App → feature pages → feature components/model →
feature api → infraestrutura compartilhada`. Módulos compartilhados não podem
importar uma feature para resolver regra de negócio. Imports entre features
serão evitados; quando um contrato realmente for compartilhado, ele será
extraído para `src/@types` ou para uma abstração transversal explicitamente
justificada.

Imports entre módulos usarão o alias `@`; imports relativos ficam restritos à
mesma feature ou subpasta próxima. A checagem estrutural deverá procurar
referências aos caminhos legados e ciclos/atalhos indevidos.

### Preservar compatibilidade antes de melhorar o comportamento

Primeiro serão movidos arquivos e imports mantendo nomes, endpoints, formatos e
composição atuais. A alteração de comportamento será rejeitada nesta change,
mesmo que o inventário revele defeitos conhecidos, como a duplicidade dos
cadastros. Isso permite separar falhas de movimentação de correções funcionais.

## Risks / Trade-offs

- [A movimentação pode quebrar imports indiretos ou mocks] → consultar o
  CodeGraph antes e depois, atualizar todos os consumidores, executar build,
  lint e testes afetados e procurar referências aos caminhos removidos.
- [A feature de pacientes ainda carrega dois fluxos legados] → manter ambos
  identificáveis, documentar a limitação e abrir uma change funcional própria
  para escolher o contrato de cadastro.
- [Tipos semelhantes podem não ser equivalentes] → comparar campos, usos e
  respostas observadas; não consolidar tipos sem evidência e registrar exceções.
- [A pasta `@types` pode virar um novo depósito global] → exigir agrupamento por
  domínio, revisão de cada novo contrato e permitir tipos privados locais quando
  não houver compartilhamento.
- [Falhas preexistentes podem parecer regressão] → capturar a linha de base de
  lint, build e testes antes da migração e separar falha conhecida de falha
  introduzida.

## Migration Plan

1. Registrar a árvore atual, referências do CodeGraph e a linha de base das
   verificações relevantes.
2. Criar a estrutura de `features/patients` e mover os módulos específicos,
   atualizando `Router`, `App`, testes e imports sem alterar contratos externos.
3. Auditar e reorganizar os tipos de pacientes, agenda, sessão, autenticação,
   perfil e componentes; redirecionar consumidores e remover duplicatas somente
   quando comprovadamente equivalentes.
4. Atualizar READMEs e documentação transversal com o padrão e as lacunas
   restantes.
5. Executar a checagem estrutural, testes afetados, lint, build e validação
   OpenSpec; registrar falhas preexistentes ou bloqueios externos.

Rollback de código: restaurar os caminhos e imports anteriores por uma mudança
revisável caso a validação identifique regressão. Não há migração de banco,
alteração de endpoint ou dado compartilhado nesta change.
